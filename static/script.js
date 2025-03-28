// ✅ script.js (GPT 분석은 백엔드, 지도는 프론트에서 처리)

let currentImageName = "";
let marker;

function handleFile(input, isImage) {
  const file = input.files[0];
  if (!file || !isImage) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const previewImage = document.getElementById("previewImage");
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
    document.getElementById("imageWrapper").style.display = "block";
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("image", file);

  const resultSection = document.getElementById("resultSection");
  const resultTitle = document.getElementById("resultTitle");
  const resultContent = document.getElementById("resultContent");

  resultTitle.textContent = "Analyzing...";
  resultContent.textContent = "GPT가 이미지를 분석 중입니다...";
  resultSection.style.display = "block";

  fetch("/analyze-image", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result) {
        const keyword = data.result.trim().split("\n")[0];
        const encoded = encodeURIComponent(keyword);
        const mapLink = `https://map.naver.com/v5/search/${encoded}`;

        document.getElementById("searchInput").value = keyword;
        resultTitle.textContent = "Image Analysis Result";
        resultContent.innerHTML = `
          <strong>📍 ${keyword}</strong><br>
          ${data.result.replace(keyword, "")}<br><br>
          👉 <a href="${mapLink}" target="_blank">네이버 지도에서 \"${keyword}\" 검색</a>
        `;

        handleKeywordMapSearch(keyword);
      } else {
        resultContent.textContent = "분석 결과를 가져올 수 없습니다.";
      }
    })
    .catch((err) => {
      resultContent.textContent = "분석 중 오류가 발생했습니다.";
      console.error(err);
    });
}

function handleSearch() {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return;

  const encoded = encodeURIComponent(keyword);
  const mapLink = `https://map.naver.com/v5/search/${encoded}`;

  document.getElementById("resultTitle").textContent = "검색 결과";
  document.getElementById("resultContent").innerHTML = `
    👉 <a href="${mapLink}" target="_blank">네이버 지도에서 \"${keyword}\" 검색</a>
  `;
  document.getElementById("resultSection").style.display = "block";

  handleKeywordMapSearch(keyword);
}

function handleKeywordMapSearch(keyword) {
  naver.maps.Service.geocode({ query: keyword }, function (status, response) {
    if (status !== naver.maps.Service.Status.OK) {
      alert("지도에서 장소를 찾을 수 없습니다.");
      return;
    }

    const result = response.v2.addresses[0];
    if (!result) {
      alert("좌표를 찾을 수 없습니다.");
      return;
    }

    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);
    showMap(lat, lng, keyword);
  });
}

function showMap(lat, lng, placeName) {
  document.getElementById("map").style.display = "block";

  const map = new naver.maps.Map("map", {
    center: new naver.maps.LatLng(lat, lng),
    zoom: 14,
  });

  if (marker) marker.setMap(null);

  marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(lat, lng),
    map: map,
    title: placeName,
  });
}

function removeImage() {
  document.getElementById("previewImage").src = "";
  document.getElementById("imageWrapper").style.display = "none";
  document.getElementById("searchInput").value = "";
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("map").style.display = "none";
  currentImageName = "";
}

function handleInputChange() {
  const input = document.getElementById("searchInput").value.trim();
  const imageWrapper = document.getElementById("imageWrapper");
  if (input !== currentImageName) {
    imageWrapper.style.display = "none";
    document.getElementById("previewImage").src = "";
    currentImageName = "";
  }
}