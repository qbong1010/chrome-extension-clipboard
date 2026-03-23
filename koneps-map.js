export let favoritesMap = null;
let geoJsonLayer = null;
let labelLayerGroup = null;
let geoJsonData = null;

export async function initFavoritesMap() {
  if (favoritesMap) {
    setTimeout(() => favoritesMap.invalidateSize(), 100);
    return;
  }

  const mapContainer = document.getElementById('favoritesMap');
  if (!mapContainer) return;

  favoritesMap = L.map('favoritesMap', {
    center: [36.0, 127.8],
    zoom: 7,
    zoomControl: true,
    attributionControl: false
  });

  labelLayerGroup = L.layerGroup().addTo(favoritesMap);

  try {
    const url = chrome.runtime.getURL('data/skorea-municipalities.json');
    const response = await fetch(url);
    geoJsonData = await response.json();
    console.log(`[Map] GeoJSON loaded: ${geoJsonData.features.length} features`);

    // 초기 기본 스타일로 그리기
    geoJsonLayer = L.geoJSON(geoJsonData, {
      style: {
        color: '#CBD5E1',
        weight: 1,
        fillColor: '#F8FAFC',
        fillOpacity: 1
      }
    }).addTo(favoritesMap);

    // 줌 변경 시 라벨 갱신
    favoritesMap.on('zoomend', () => refreshLabels());

  } catch (error) {
    console.error('[Map] Failed to load GeoJSON:', error);
  }
}

// ── 지역명 라벨 표시 ──
function refreshLabels() {
  if (!labelLayerGroup || !geoJsonData || !favoritesMap) return;
  labelLayerGroup.clearLayers();

  const zoom = favoritesMap.getZoom();
  // 줌 7 이상에서만 라벨 표시 (너무 작으면 안 보임)
  if (zoom < 7) return;

  const fontSize = zoom >= 10 ? 11 : zoom >= 8 ? 9 : 7;

  geoJsonData.features.forEach(f => {
    const name = f.properties.name;
    // 폴리곤 중심 계산
    const layer = L.geoJSON(f);
    const center = layer.getBounds().getCenter();

    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'map-region-label',
        html: `<span style="
          font-size:${fontSize}px;
          color:#64748B;
          white-space:nowrap;
          pointer-events:none;
          font-weight:500;
          text-shadow: 0 0 3px #fff, 0 0 3px #fff;
        ">${name}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      }),
      interactive: false
    });
    labelLayerGroup.addLayer(label);
  });
}

// ── 즐겨찾기 데이터로 지도 업데이트 ──
export function updateFavoritesMap(favorites) {
  if (!favoritesMap || !geoJsonData) {
    console.log('[Map] Skip update — not ready', { map: !!favoritesMap, geo: !!geoJsonData });
    return;
  }

  // 기존 레이어 제거
  if (geoJsonLayer) {
    favoritesMap.removeLayer(geoJsonLayer);
  }

  // ── 즐겨찾기 → 지역 매핑 ──
  const favCounts = {};
  const favItems = {};
  const GENERIC_NAMES = ['중구','동구','남구','북구','서구'];

  // org에서 "OO시" or "OO군" 이름 추출 (예: "충청북도 청주시" → "청주시")
  function extractCityName(org) {
    const match = org.match(/([가-힣]+[시군])\s*$/);
    return match ? match[1] : null;
  }

  favorites.forEach(fav => {
    const org = fav.org || '';

    // 1차: org가 GeoJSON name을 포함하는지 (예: "강원특별자치도 철원군".includes("철원군"))
    let feature = geoJsonData.features.find(f => {
      const name = f.properties.name;
      if (GENERIC_NAMES.includes(name)) return false;
      return org.includes(name);
    });

    // 2차: GeoJSON name이 org의 시/군 이름으로 시작하는지 (예: "청주시흥덕구".startsWith("청주시"))
    if (!feature) {
      const cityName = extractCityName(org);
      if (cityName) {
        // 해당 시 이름으로 시작하는 모든 구를 찾아서 전부 색칠
        const subFeatures = geoJsonData.features.filter(f => {
          return f.properties.name.startsWith(cityName) && f.properties.name !== cityName;
        });
        if (subFeatures.length > 0) {
          subFeatures.forEach(sf => {
            const code = sf.properties.code;
            favCounts[code] = (favCounts[code] || 0) + 1;
            if (!favItems[code]) favItems[code] = [];
            favItems[code].push(fav);
          });
          console.log(`[Map] ✓ "${org}" → ${subFeatures.map(f=>f.properties.name).join(', ')} (${subFeatures.length}개 구)`);
          return; // forEach continue
        }
      }
    }

    if (feature) {
      const code = feature.properties.code;
      favCounts[code] = (favCounts[code] || 0) + 1;
      if (!favItems[code]) favItems[code] = [];
      favItems[code].push(fav);
      console.log(`[Map] ✓ "${org}" → ${feature.properties.name}`);
    } else {
      console.log(`[Map] ✗ "${org}" → no match`);
    }
  });

  console.log(`[Map] Matched regions:`, Object.keys(favCounts).length);

  // ── GeoJSON 다시 그리기 (항상 색칠) ──
  geoJsonLayer = L.geoJSON(geoJsonData, {
    style: function(feature) {
      const code = feature.properties.code;
      if (favCounts[code]) {
        return {
          color: '#0284C7',       // 파란색 선
          weight: 2,
          fillColor: '#BAE6FD',   // 하늘색 칠
          fillOpacity: 0.7
        };
      }
      return {
        color: '#CBD5E1',
        weight: 1,
        fillColor: '#F8FAFC',
        fillOpacity: 1
      };
    },
    onEachFeature: function(feature, layer) {
      const code = feature.properties.code;
      const items = favItems[code];
      if (items && items.length > 0) {
        // 호버 효과
        layer.on('mouseover', function() {
          this.setStyle({ fillOpacity: 0.9, weight: 3 });
        });
        layer.on('mouseout', function() {
          this.setStyle({ fillOpacity: 0.7, weight: 2 });
        });
        // 클릭 → 리스트 스크롤
        layer.on('click', () => {
          scrollToFavorite(items[0].no);
        });
      }
    }
  }).addTo(favoritesMap);

  // 라벨 갱신
  refreshLabels();
}

// ── 리스트 스크롤 + 하이라이트 ──
function scrollToFavorite(no) {
  const scrollContainer = document.querySelector('#konepsFavoritesView .scroll-y');
  const card = document.querySelector(`.koneps-result-card[data-no="${no}"]`);

  if (card && scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offset = cardRect.top - containerRect.top + scrollContainer.scrollTop - 10;

    scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });

    card.style.transition = 'box-shadow 0.3s ease';
    card.style.boxShadow = '0 0 0 2px #0EA5E9, 0 4px 12px rgba(14, 165, 233, 0.3)';

    setTimeout(() => {
      card.style.boxShadow = '';
      if (!card.classList.contains('expanded')) {
        card.click();
      }
    }, 600);
  }
}
