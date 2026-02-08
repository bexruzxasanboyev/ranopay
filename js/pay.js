const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyS2qxi3KQoGJwp1EywB8MRoFKDBCJZmpuHWVW4ehuWmSgE95mn3OJ5nSES4hU1YGYf/exec";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Ma'lumotlarni olish
    const storedData = localStorage.getItem("formData");
    if (!storedData) return;

    const data = JSON.parse(storedData);
    if (!data.timestamp) return;

    const date = new Date(data.timestamp);

    // Format: oy.kun.yil soat:minut
    const formattedDate = `${String(date.getMonth() + 1).padStart(
      2,barakali ayol marafoni
      "0"
    )}.${String(date.getDate()).padStart(
      2,
      "0"
    )}.${date.getFullYear()} ${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;
    const formData = new FormData();
    formData.append("Ism", data.name);
    formData.append("Telefon raqam", data.phone_number);
    formData.append("Tarif", data.type);
    formData.append("Sana", formattedDate);
    formData.append("imageUpload", false);
    formData.append("sheetName", "SignUp");
    formData.append("Oferta", data.offerta);

    // Yuborish
    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Ma'lumot yuborildi");
    } else {
      console.error("Yuborishda xatolik:", response.statusText);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
});

const localData = JSON.parse(localStorage.getItem("formData") || "{}");
const payment__tariff = document.querySelector(".payment__tariff");
const payment__price = document.querySelectorAll(".pricesAll");
const payment__price2 = document.querySelector(".payment__card-amount");

payment__tariff.innerHTML = `
    Tarif: ${localData.type || "VIP"}
`;

// Har bir .pricesAll elementiga qiymat qo'yish
payment__price.forEach((priceElement) => {
  if (localData.type === "standart") {
    priceElement.innerHTML = "99 000 so'm";
  } else if (localData.type === "standart+") {
    priceElement.innerHTML = "99 000 so'm";
  } else {
    priceElement.innerHTML = "99 000 so'm";
  }
});

const priceUSD = document.querySelector(".priceUSD");

// Determine the UZS amount based on the tariff
let amountUZS;
if (localData.type === "standart") {
  amountUZS = 99000;
} else if (localData.type === "standart+") {
  amountUZS = 99000;
} else {
  amountUZS = 99000;
}

// Convert UZS to USD and set the value in the priceUSD element
convertUZStoUSD(amountUZS).then((usd) => {
  if (usd && priceUSD) {
    priceUSD.innerHTML = `$${usd}`;
  }
});

async function convertUZStoUSD(amountUZS) {
  try {
    const response = await fetch(
      "https://v6.exchangerate-api.com/v6/fdb1c54a6bf927bbc9eb4862/latest/UZS"
    );
    const data = await response.json();
    const rate = data.conversion_rates.USD; // 1 UZS = ? USD (masalan, 0.00007872)
    const amountUSD = (amountUZS * rate).toFixed(2); // So‘mni USD ga aylantirish
    return amountUSD;
  } catch (error) {
    console.error("Valyuta kursini olishda xatolik:", error);
    return null;
  }
}
document
  .getElementById("paymentForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = this.querySelector(".payment__btn");
    submitButton.disabled = true;
    submitButton.textContent = "Yuborilmoqda...";

    try {
      const localData = JSON.parse(localStorage.getItem("formData") || "{}");

      if (!localData.name || !localData.phone_number) {
        alert(
          "Ism yoki telefon raqami topilmadi. Iltimos, formani to‘ldiring."
        );
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      const form = new FormData(this);
      const paymentType = form.get("status") || "";
      const file = form.get("chek");

      if (!file || file.size === 0) {
        alert("Chek rasmini yuklang");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Fayl hajmi 10MB dan kichik bo‘lishi kerak");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        alert("Faqat PNG, JPG yoki PDF fayllarni yuklash mumkin");
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
        return;
      }

      // update localStorage meta
      const updatedLocalData = {
        ...localData,
        payment_type: String(paymentType),
        file_name: file.name,
        last_submitted: new Date().toISOString(),
      };
      localStorage.setItem("formData", JSON.stringify(updatedLocalData));

      // convert file to base64 (DataURL) and strip prefix
      const toBase64 = (f) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result; // data:<mime>;base64,<data>
            const commaIndex = result.indexOf(",");
            const b64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
            resolve({ b64, mime: f.type });
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(f);
        });

      const { b64, mime } = await toBase64(file);

      // Build the payload the server expects (base64 approach)
      const payload = {
        sheetName: "Lead", // change if needed
        imageUpload: true,
        checkUrlHeader: "Check URL", // or your Uzbek label
        Ism: localData.name.toString(),
        "Telefon raqam": localData.phone_number.toString(),
        Tarif: localData.type || "",
        Status: String(paymentType || ""),
        file_data: b64,
        file_filename: file.name,
        file_mime: mime,
        createdAt: new Date().toISOString(),
        Oferta: localData.offerta
      };

      // Save pending submission (stringified) — used by thankYou page
      localStorage.setItem("pendingSubmission", JSON.stringify(payload));

      // Try a non-blocking sendBeacon as an immediate best-effort (optional)
      try {
        if (navigator.sendBeacon) {
          // sendBeacon expects ArrayBuffer, Blob, or FormData. We'll send FormData.
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
          // sendBeacon returns true if the user agent successfully queued the data
          navigator.sendBeacon(SHEET_URL, fd);
        }
      } catch (e) {
        // ignore — it's best-effort
        console.warn("sendBeacon attempt failed:", e);
      }

      // Reset the form UI immediately and redirect to thank you page
      this.reset();
      document.querySelector(".uploadCheck").innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
<g>
<path d="M 3.86 63.09 C1.51,61.19 1.50,61.08 1.17,35.84 C0.80,8.16 1.33,4.08 5.54,2.16 C7.05,1.47 13.26,1.00 20.80,1.00 L 33.52 1.00 L 43.26 10.29 L 53.00 19.59 L 53.00 40.29 C53.00,59.67 52.87,61.13 51.00,63.00 C49.12,64.88 47.67,65.00 27.61,65.00 C8.05,65.00 6.02,64.84 3.86,63.09 ZM 49.96 60.07 C50.57,58.94 51.00,50.61 51.00,40.07 L 51.00 22.00 L 43.65 22.00 C33.94,22.00 32.65,20.71 32.65,10.98 L 32.65 4.00 L 19.36 4.00 C7.24,4.00 5.98,4.17 5.04,5.93 C3.49,8.82 3.64,59.24 5.20,60.80 C6.06,61.66 12.46,62.00 27.66,62.00 C47.67,62.00 48.99,61.88 49.96,60.07 ZM 41.70 12.22 L 35.00 5.52 L 35.00 11.14 C35.00,14.47 35.52,17.19 36.28,17.81 C37.43,18.77 46.86,19.90 47.95,19.21 C48.20,19.06 45.39,15.91 41.70,12.22 ZM 14.00 50.92 C14.00,48.08 14.38,46.97 15.25,47.27 C15.94,47.51 16.46,48.67 16.42,49.85 C16.34,51.92 16.73,52.00 27.17,52.00 L 38.00 52.00 L 38.00 49.50 C38.00,47.94 38.57,47.00 39.50,47.00 C40.58,47.00 41.00,48.11 41.00,51.00 L 41.00 55.00 L 27.50 55.00 L 14.00 55.00 L 14.00 50.92 ZM 26.00 37.83 L 26.00 31.65 L 23.68 33.83 C19.73,37.54 19.73,34.86 23.68,30.81 L 27.41 27.00 L 31.16 30.66 C35.19,34.59 35.40,37.67 31.39,33.90 L 29.00 31.65 L 29.00 37.83 C29.00,42.65 28.67,44.00 27.50,44.00 C26.33,44.00 26.00,42.65 26.00,37.83 Z" fill="rgba(0,0,0,1)"/>
</g>
</svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      submitButton.disabled = false;
      submitButton.textContent = "Davom etish";

      // Redirect right away — thankYou page will take over sending in background
      window.location.href = "/thankYou.html";
    } catch (err) {
      console.error("Submit error:", err);
      alert(
        `Xato yuz berdi: ${
          err.message || err
        }. Iltimos, keyinroq qayta urinib ko‘ring.`
      );
      const submitButton = document.querySelector(".payment__btn");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Davom etish";
      }
    }
  });

// Update upload label when file selected
document.getElementById("chek").addEventListener("change", function () {
  const file = this.files[0];
  const uploadLabel = document.querySelector(".uploadCheck");

  if (file) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Fayl hajmi 10MB dan kichik bo‘lishi kerak");
      this.value = "";
      uploadLabel.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
<g>
<path d="M 3.86 63.09 C1.51,61.19 1.50,61.08 1.17,35.84 C0.80,8.16 1.33,4.08 5.54,2.16 C7.05,1.47 13.26,1.00 20.80,1.00 L 33.52 1.00 L 43.26 10.29 L 53.00 19.59 L 53.00 40.29 C53.00,59.67 52.87,61.13 51.00,63.00 C49.12,64.88 47.67,65.00 27.61,65.00 C8.05,65.00 6.02,64.84 3.86,63.09 ZM 49.96 60.07 C50.57,58.94 51.00,50.61 51.00,40.07 L 51.00 22.00 L 43.65 22.00 C33.94,22.00 32.65,20.71 32.65,10.98 L 32.65 4.00 L 19.36 4.00 C7.24,4.00 5.98,4.17 5.04,5.93 C3.49,8.82 3.64,59.24 5.20,60.80 C6.06,61.66 12.46,62.00 27.66,62.00 C47.67,62.00 48.99,61.88 49.96,60.07 ZM 41.70 12.22 L 35.00 5.52 L 35.00 11.14 C35.00,14.47 35.52,17.19 36.28,17.81 C37.43,18.77 46.86,19.90 47.95,19.21 C48.20,19.06 45.39,15.91 41.70,12.22 ZM 14.00 50.92 C14.00,48.08 14.38,46.97 15.25,47.27 C15.94,47.51 16.46,48.67 16.42,49.85 C16.34,51.92 16.73,52.00 27.17,52.00 L 38.00 52.00 L 38.00 49.50 C38.00,47.94 38.57,47.00 39.50,47.00 C40.58,47.00 41.00,48.11 41.00,51.00 L 41.00 55.00 L 27.50 55.00 L 14.00 55.00 L 14.00 50.92 ZM 26.00 37.83 L 26.00 31.65 L 23.68 33.83 C19.73,37.54 19.73,34.86 23.68,30.81 L 27.41 27.00 L 31.16 30.66 C35.19,34.59 35.40,37.67 31.39,33.90 L 29.00 31.65 L 29.00 37.83 C29.00,42.65 28.67,44.00 27.50,44.00 C26.33,44.00 26.00,42.65 26.00,37.83 Z" fill="rgba(0,0,0,1)"/>
</g>
</svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Faqat PNG, JPG yoki PDF fayllarni yuklash mumkin");
      this.value = "";
      uploadLabel.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
<g>
<path d="M 3.86 63.09 C1.51,61.19 1.50,61.08 1.17,35.84 C0.80,8.16 1.33,4.08 5.54,2.16 C7.05,1.47 13.26,1.00 20.80,1.00 L 33.52 1.00 L 43.26 10.29 L 53.00 19.59 L 53.00 40.29 C53.00,59.67 52.87,61.13 51.00,63.00 C49.12,64.88 47.67,65.00 27.61,65.00 C8.05,65.00 6.02,64.84 3.86,63.09 ZM 49.96 60.07 C50.57,58.94 51.00,50.61 51.00,40.07 L 51.00 22.00 L 43.65 22.00 C33.94,22.00 32.65,20.71 32.65,10.98 L 32.65 4.00 L 19.36 4.00 C7.24,4.00 5.98,4.17 5.04,5.93 C3.49,8.82 3.64,59.24 5.20,60.80 C6.06,61.66 12.46,62.00 27.66,62.00 C47.67,62.00 48.99,61.88 49.96,60.07 ZM 41.70 12.22 L 35.00 5.52 L 35.00 11.14 C35.00,14.47 35.52,17.19 36.28,17.81 C37.43,18.77 46.86,19.90 47.95,19.21 C48.20,19.06 45.39,15.91 41.70,12.22 ZM 14.00 50.92 C14.00,48.08 14.38,46.97 15.25,47.27 C15.94,47.51 16.46,48.67 16.42,49.85 C16.34,51.92 16.73,52.00 27.17,52.00 L 38.00 52.00 L 38.00 49.50 C38.00,47.94 38.57,47.00 39.50,47.00 C40.58,47.00 41.00,48.11 41.00,51.00 L 41.00 55.00 L 27.50 55.00 L 14.00 55.00 L 14.00 50.92 ZM 26.00 37.83 L 26.00 31.65 L 23.68 33.83 C19.73,37.54 19.73,34.86 23.68,30.81 L 27.41 27.00 L 31.16 30.66 C35.19,34.59 35.40,37.67 31.39,33.90 L 29.00 31.65 L 29.00 37.83 C29.00,42.65 28.67,44.00 27.50,44.00 C26.33,44.00 26.00,42.65 26.00,37.83 Z" fill="rgba(0,0,0,1)"/>
</g>
</svg>
        Chek rasmini yuklash uchun bu yerga bosing
      `;
      return;
    }

    uploadLabel.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
<g>
<path d="M 3.86 63.09 C1.51,61.19 1.50,61.08 1.17,35.84 C0.80,8.16 1.33,4.08 5.54,2.16 C7.05,1.47 13.26,1.00 20.80,1.00 L 33.52 1.00 L 43.26 10.29 L 53.00 19.59 L 53.00 40.29 C53.00,59.67 52.87,61.13 51.00,63.00 C49.12,64.88 47.67,65.00 27.61,65.00 C8.05,65.00 6.02,64.84 3.86,63.09 ZM 49.96 60.07 C50.57,58.94 51.00,50.61 51.00,40.07 L 51.00 22.00 L 43.65 22.00 C33.94,22.00 32.65,20.71 32.65,10.98 L 32.65 4.00 L 19.36 4.00 C7.24,4.00 5.98,4.17 5.04,5.93 C3.49,8.82 3.64,59.24 5.20,60.80 C6.06,61.66 12.46,62.00 27.66,62.00 C47.67,62.00 48.99,61.88 49.96,60.07 ZM 41.70 12.22 L 35.00 5.52 L 35.00 11.14 C35.00,14.47 35.52,17.19 36.28,17.81 C37.43,18.77 46.86,19.90 47.95,19.21 C48.20,19.06 45.39,15.91 41.70,12.22 ZM 14.00 50.92 C14.00,48.08 14.38,46.97 15.25,47.27 C15.94,47.51 16.46,48.67 16.42,49.85 C16.34,51.92 16.73,52.00 27.17,52.00 L 38.00 52.00 L 38.00 49.50 C38.00,47.94 38.57,47.00 39.50,47.00 C40.58,47.00 41.00,48.11 41.00,51.00 L 41.00 55.00 L 27.50 55.00 L 14.00 55.00 L 14.00 50.92 ZM 26.00 37.83 L 26.00 31.65 L 23.68 33.83 C19.73,37.54 19.73,34.86 23.68,30.81 L 27.41 27.00 L 31.16 30.66 C35.19,34.59 35.40,37.67 31.39,33.90 L 29.00 31.65 L 29.00 37.83 C29.00,42.65 28.67,44.00 27.50,44.00 C26.33,44.00 26.00,42.65 26.00,37.83 Z" fill="rgba(0,0,0,1)"/>
</g>
</svg>
      ${file.name}
    `;
  } else {
    uploadLabel.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="54" height="66" viewBox="0 0 54 66">
<g>
<path d="M 3.86 63.09 C1.51,61.19 1.50,61.08 1.17,35.84 C0.80,8.16 1.33,4.08 5.54,2.16 C7.05,1.47 13.26,1.00 20.80,1.00 L 33.52 1.00 L 43.26 10.29 L 53.00 19.59 L 53.00 40.29 C53.00,59.67 52.87,61.13 51.00,63.00 C49.12,64.88 47.67,65.00 27.61,65.00 C8.05,65.00 6.02,64.84 3.86,63.09 ZM 49.96 60.07 C50.57,58.94 51.00,50.61 51.00,40.07 L 51.00 22.00 L 43.65 22.00 C33.94,22.00 32.65,20.71 32.65,10.98 L 32.65 4.00 L 19.36 4.00 C7.24,4.00 5.98,4.17 5.04,5.93 C3.49,8.82 3.64,59.24 5.20,60.80 C6.06,61.66 12.46,62.00 27.66,62.00 C47.67,62.00 48.99,61.88 49.96,60.07 ZM 41.70 12.22 L 35.00 5.52 L 35.00 11.14 C35.00,14.47 35.52,17.19 36.28,17.81 C37.43,18.77 46.86,19.90 47.95,19.21 C48.20,19.06 45.39,15.91 41.70,12.22 ZM 14.00 50.92 C14.00,48.08 14.38,46.97 15.25,47.27 C15.94,47.51 16.46,48.67 16.42,49.85 C16.34,51.92 16.73,52.00 27.17,52.00 L 38.00 52.00 L 38.00 49.50 C38.00,47.94 38.57,47.00 39.50,47.00 C40.58,47.00 41.00,48.11 41.00,51.00 L 41.00 55.00 L 27.50 55.00 L 14.00 55.00 L 14.00 50.92 ZM 26.00 37.83 L 26.00 31.65 L 23.68 33.83 C19.73,37.54 19.73,34.86 23.68,30.81 L 27.41 27.00 L 31.16 30.66 C35.19,34.59 35.40,37.67 31.39,33.90 L 29.00 31.65 L 29.00 37.83 C29.00,42.65 28.67,44.00 27.50,44.00 C26.33,44.00 26.00,42.65 26.00,37.83 Z" fill="rgba(0,0,0,1)"/>
</g>
</svg>
      Chek rasmini yuklash uchun bu yerga bosing
    `;
  }
});

let timerElement = document.getElementById("timer");
let time = timerElement.innerText.split(":");
let minutes = parseInt(time[0], 10);
let seconds = parseInt(time[1], 10);

function updateTimer() {
  if (seconds === 0) {
    if (minutes === 0) {
      clearInterval(timerInterval);
      timerElement.innerText = "00:00";
      // Bu yerga tugaganidan keyin nima bo'lishi kerakligini yoz
      return;
    }
    minutes--;
    seconds = 59;
  } else {
    seconds--;
  }

  let minStr = minutes < 10 ? "0" + minutes : minutes;
  let secStr = seconds < 10 ? "0" + seconds : seconds;
  timerElement.innerText = `${minStr}:${secStr}`;
}

let timerInterval = setInterval(updateTimer, 1000);

document.querySelectorAll(".copy").forEach((btn) => {
  // Store the original SVG
  const originalSVG = btn.innerHTML;

  // Define the tick SVG
  const tickSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2F80EC" class="size-8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  `;

  btn.addEventListener("click", () => {
    // Find the card number from the closest .payment__card element
    const cardNumber = btn
      .closest(".payment__card")
      .querySelector(".payment__card-number")
      .textContent.trim();

    // Copy to clipboard
    navigator.clipboard
      .writeText(cardNumber)
      .then(() => {
        // Show success message

        // Change to tick SVG
        btn.innerHTML = tickSVG;

        // Revert to original SVG after 1.5 seconds
        setTimeout(() => {
          btn.innerHTML = originalSVG;
        }, 1500);
      })
      .catch((err) => {
        // Show error message
        alert("Nusxalashda xatolik yuz berdi!");
        console.error(err);
      });
  });
});
