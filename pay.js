const PAYMENT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKjQfzKHKMYGW746Yq8k-Xo0Sg7FfrWKtb7cvhbix356EAUCYI7m9ed6fBHg8xJw5s/exec";

function submitPayment() {
    const file = document.getElementById('slipInput').files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const payload = {
            id: document.getElementById('orderId').value,
            amount: document.getElementById('amount').value,
            image: e.target.result
        };

        fetch(PAYMENT_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => alert("ส่งสลิปเรียบร้อย! รอช่างตรวจสอบ"));
    };
    reader.readAsDataURL(file);
}