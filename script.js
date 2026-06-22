// ─── ⚙️ ตั้งค่าข้อมูลเชื่อมต่อระบบระบบร้าน ───
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUd6yMGkQjXEJ6jSdVtSvz6-m5e7jpEqCRNzwLoI0nw2ApmIJg7p3C9BV8cnGszZVt/exec";
const PROMPTPAY_NUMBER = "0932365807"; // ⚠️ เบอร์โทรศัพท์พร้อมเพย์ร้าน Fix & Pub

if (localStorage.getItem('isLoggedIn') !== 'true' && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
}

let repairJobs = [];
let inventoryItems = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    fetchDataFromGoogleSheets();
    fetchInventoryFromGoogleSheets();

    document.getElementById('addRepairForm').addEventListener('submit', handleAddRepair);
    document.getElementById('editRepairForm').addEventListener('submit', handleSaveEdit);

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });
});

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');

            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(target).classList.add('active');

            if (target === "inventory-page") {
                fetchInventoryFromGoogleSheets();
            } else {
                fetchDataFromGoogleSheets();
                fetchInventoryFromGoogleSheets();
            }
        });
    });
}

function fetchDataFromGoogleSheets() {
    const recentTable = document.getElementById('recent-jobs-table');
    const allTable = document.getElementById('all-jobs-table');
    if (recentTable && allTable) {
        recentTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#aaa;">กำลังโหลด...</td></tr>`;
        allTable.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#aaa;">กำลังโหลด...</td></tr>`;
    }

    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            repairJobs = data;
            updateAppUI();
        })
        .catch(err => {
            console.error(err);
            if (allTable) allTable.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ff4444;">❌ เชื่อมต่อฐานข้อมูลล้มเหลว</td></tr>`;
        });
}

function fetchInventoryFromGoogleSheets() {
    fetch(`${SCRIPT_URL}?type=inventory`)
        .then(response => response.json())
        .then(data => {
            inventoryItems = data;
            renderInventoryTable();
            populateInventoryDropdown();
        })
        .catch(err => console.error("Error loading inventory:", err));
}

function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (inventoryItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#aaa;">ไม่มีข้อมูลอะไหล่ในคลัง</td></tr>`;
        return;
    }

    inventoryItems.forEach(item => {
        let stockNum = Number(item.stock);
        let statusBadge = "";

        if (stockNum === 0) {
            statusBadge = `<span class="badge" style="background: rgba(255, 68, 68, 0.2); color: #ff4444;">สินค้าหมดเกลี้ยง</span>`;
        } else if (stockNum <= 2) {
            statusBadge = `<span class="badge" style="background: rgba(255, 153, 0, 0.2); color: #ff9900;">สินค้าใกล้หมด</span>`;
        } else {
            statusBadge = `<span class="badge" style="background: rgba(0, 200, 81, 0.2); color: #00c851;">พร้อมใช้งาน</span>`;
        }

        tableBody.innerHTML += `
            <tr>
                <td><strong>${item.part_id}</strong></td>
                <td>${item.part_name}</td>
                <td style="font-size:1.1rem; font-weight:bold;" class="${stockNum <= 2 ? 'text-yellow' : ''}">${stockNum} ชิ้น</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
}

function populateInventoryDropdown() {
    const dropdown = document.getElementById('selectPartId');
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="none">-- ไม่ใช้อะไหล่ในคลัง / งานค่าแรงอย่างเดียว --</option>`;

    inventoryItems.forEach(item => {
        let stockNum = Number(item.stock);
        if (stockNum > 0) {
            dropdown.innerHTML += `<option value="${item.part_id}">เบิก [${item.part_id}] ${item.part_name} (คงเหลือในคลัง ${stockNum} ชิ้น)</option>`;
        } else {
            dropdown.innerHTML += `<option value="none" disabled>❌ [${item.part_id}] ${item.part_name} (สินค้าหมดคลัง)</option>`;
        }
    });
}

function updateAppUI() {
    let pending = repairJobs.filter(j => j.status === 'รอดำเนินการ').length;
    let progress = repairJobs.filter(j => j.status === 'กำลังซ่อม').length;
    let success = repairJobs.filter(j => j.status === 'ซ่อมเสร็จแล้ว').length;

    document.getElementById('count-pending').textContent = pending;
    document.getElementById('count-progress').textContent = progress;
    document.getElementById('count-success').textContent = success;

    const recentTable = document.getElementById('recent-jobs-table');
    if (recentTable) {
        recentTable.innerHTML = '';
        const recentJobs = [...repairJobs].reverse().slice(0, 3);

        recentJobs.forEach(job => {
            recentTable.innerHTML += `
                <tr>
                    <td><strong>${job.id}</strong></td>
                    <td>${job.name} <br> <small style="color: #aaa">${job.model}</small></td>
                    <td>${job.detail}</td>
                    <td class="text-yellow">${Number(job.price).toLocaleString()} ฿</td>
                    <td><span class="badge ${getBadgeClass(job.status)}">${job.status}</span></td>
                </tr>
            `;
        });
    }

    const allTable = document.getElementById('all-jobs-table');
    if (!allTable) return;
    allTable.innerHTML = '';

    if (repairJobs.length === 0) {
        allTable.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#aaa;">ไม่มีข้อมูลงานซ่อมในระบบ</td></tr>`;
        return;
    }

    [...repairJobs].reverse().forEach(job => {
        // เช็คว่ามีข้อมูลลิงก์สลิปโอนเงินส่งมาจากหลังบ้านหรือไม่
        let slipButton = `<span style="color: #666; font-size: 0.85rem;">ยังไม่ส่งสลิป</span>`;
        if (job.slip) {
            slipButton = `<a href="${job.slip}" target="_blank" style="background: #28a745; color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: bold;"><i class="fa-solid fa-file-invoice-dollar"></i> เปิดดูสลิป</a>`;
        }

        allTable.innerHTML += `
            <tr>
                <td><strong>${job.id}</strong></td>
                <td>${job.name}</td>
                <td>${job.model}</td>
                <td><small>${job.detail}</small></td>
                <td class="text-yellow">${Number(job.price).toLocaleString()}</td>
                <td><span class="badge ${getBadgeClass(job.status)}">${job.status}</span></td>
                <td>${slipButton}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action-print" onclick="printReceipt('${job.id}')"><i class="fa-solid fa-print"></i> พิมพ์บิล</button>
                        <button class="btn-action-edit" onclick="openEditModal('${job.id}')"><i class="fa-solid fa-pen-to-square"></i> แก้ไข/ชำระเงิน</button>
                        <button class="btn-action-delete" onclick="deleteJob('${job.id}')"><i class="fa-solid fa-trash"></i> ลบ</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function getBadgeClass(status) {
    if (status === 'รอดำเนินการ') return 'badge-pending';
    if (status === 'กำลังซ่อม') return 'badge-progress';
    if (status === 'ซ่อมเสร็จแล้ว') return 'badge-success';

    // เพิ่มสถานะใหม่ของคุณตรงนี้
    if (status === 'รออะไหล่จัดส่ง') return 'badge-waiting-part';
    if (status === 'อะไหล่มาถึงแล้ว') return 'badge-part-arrived';

    return '';
}

function handleAddRepair(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    const name = document.getElementById('customerName').value;
    const model = document.getElementById('phoneModel').value;
    const detail = document.getElementById('repairDetail').value;
    const price = document.getElementById('repairPrice').value;
    const status = document.getElementById('repairStatus').value;
    const part_id = document.getElementById('selectPartId').value;

    const newId = `FIX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob = { action: "create", id: newId, name, model, detail, price: Number(price), status, part_id };

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob)
    })
        .then(() => {
            alert(`บันทึกข้อมูลออร์เดอร์ใหม่ ${newId} สำเร็จ!`);
            document.getElementById('addRepairForm').reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
            fetchDataFromGoogleSheets();
            fetchInventoryFromGoogleSheets();
            document.querySelector('[data-target="repair-list"]').click();
        })
        .catch(err => { console.error(err); btn.innerHTML = originalText; btn.disabled = false; });
}

window.deleteJob = function (id) {
    if (confirm(`คุณต้องการลบข้อมูลออร์เดอร์ ${id} บน Google Sheets ใช่หรือไม่?`)) {
        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id: id })
        })
            .then(() => { alert('ลบข้อมูลเรียบร้อยแล้ว!'); fetchDataFromGoogleSheets(); })
            .catch(err => console.error(err));
    }
};

window.openEditModal = function (id) {
    const job = repairJobs.find(j => j.id === id);
    if (!job) return;

    document.getElementById('editJobId').value = job.id;
    document.getElementById('editModalTitleId').textContent = `(${job.id})`;
    document.getElementById('editCustomerName').value = job.name;
    document.getElementById('editPhoneModel').value = job.model;
    document.getElementById('editRepairDetail').value = job.detail;
    document.getElementById('editRepairPrice').value = job.price;
    document.getElementById('editRepairStatus').value = job.status;

    updateModalQR();
    document.getElementById('editModal').classList.add('show');
};

window.updateModalQR = function () {
    const price = document.getElementById('editRepairPrice').value || 0;
    document.getElementById('modalQRPrice').textContent = Number(price).toLocaleString();
    const qrUrl = `https://promptpay.io/${PROMPTPAY_NUMBER}/${price}.png`;
    document.getElementById('modalPromptPayQR').src = qrUrl;
};

window.closeEditModal = function () {
    document.getElementById('editModal').classList.remove('show');
};

function handleSaveEdit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit-edit');
    const originalText = btn.textContent;
    btn.textContent = 'กำลังอัปเดตข้อมูล...';
    btn.disabled = true;

    const id = document.getElementById('editJobId').value;
    const updatedJob = {
        action: "update",
        id: id,
        name: document.getElementById('editCustomerName').value,
        model: document.getElementById('editPhoneModel').value,
        detail: document.getElementById('editRepairDetail').value,
        price: Number(document.getElementById('editRepairPrice').value),
        status: document.getElementById('editRepairStatus').value
    };

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedJob)
    })
        .then(() => {
            alert('แก้ไขข้อมูลเรียบร้อยแล้ว!');
            btn.textContent = originalText; btn.disabled = false;
            closeEditModal(); fetchDataFromGoogleSheets();
        })
        .catch(err => { console.error(err); btn.textContent = originalText; btn.disabled = false; });
}

window.printReceipt = function (id) {
    const job = repairJobs.find(j => j.id === id);
    if (!job) { alert('ไม่พบข้อมูลออร์เดอร์นี้'); return; }

    document.getElementById('printId').textContent = job.id;
    document.getElementById('printCustomer').textContent = job.name;
    document.getElementById('printModel').textContent = job.model;
    document.getElementById('printDetail').textContent = job.detail;
    document.getElementById('printPrice').textContent = Number(job.price).toLocaleString();
    document.getElementById('printStatus').textContent = job.status;

    const qrUrl = `https://promptpay.io/${PROMPTPAY_NUMBER}/${job.price}.png`;
    document.getElementById('printPromptPayQR').src = qrUrl;

    const now = new Date();
    document.getElementById('printDate').textContent = now.toLocaleString('th-TH');

    window.print();
};