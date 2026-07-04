/**
 * ============================================
 * ADMIN SCRIPT - SIPADI Dinas PUPR TTS
 * Data Real dari Google Spreadsheet (CSV Export)
 * ============================================
 */

// ============================================
// KONFIGURASI - LINK CSV DARI SPREADSHEET
// ============================================
const CONFIG = {
    // ★★★ LINK CSV DARI SPREADSHEET YANG SUDAH DIPUBLIKASIKAN ★★★
    csvUrls: {
        gaji: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRHfk7N8mH_aqtXb5CkYgM-eljBJIAAJTZm64_DpjfJnPjVGr5XVEOfQULwU9WnPdSW19HTK7kPvBy/pub?output=csv',
        spj: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRn_PZVaLhCSrdT6nNOLmXLBKwiGIke69_9mZUD0wq0Wjv-4BY7sfKgsvJTQjiV-UpnVIyJfoBFyPux/pub?output=csv',
        pendapatan: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DzeTB-OsTHj7_-38kzUNZKM-d1uo8rUuSXDFZXKt3yQYdDRKFyZnZhqIL3dzA9ROuns4Zpr8rASp/pub?output=csv'
    },
    
    defaultStatus: 'Diproses'
};

// ============================================
// DATA STORAGE
// ============================================
let dataArsip = { gaji: [], spj: [], pendapatan: [] };
let chartJenis, chartTren, chartStatus;
let currentFilter = 'all';
let isLoading = false;

// ============================================
// FUNGSI LOGIN
// ============================================
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === 'admin' && password === 'admin123') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPage').style.display = 'flex';
        document.getElementById('adminName').textContent = username.charAt(0).toUpperCase() + username.slice(1);

        setTimeout(() => {
            fetchDataFromSpreadsheet();
        }, 500);
    } else {
        alert('❌ Username atau password salah!\n\nGunakan:\nUsername: admin\nPassword: admin123');
    }
}

// ============================================
// FUNGSI LOGOUT
// ============================================
function handleLogout() {
    if (confirm('Yakin ingin keluar dari Admin Panel?')) {
        document.getElementById('adminPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'admin123';
    }
}

// ============================================
// FUNGSI FETCH DATA DARI CSV (REAL DATA)
// ============================================
function fetchDataFromSpreadsheet() {
    if (isLoading) return;
    isLoading = true;
    
    const statusEl = document.getElementById('dataStatus');
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengambil data real dari spreadsheet...';
    
    dataArsip = { gaji: [], spj: [], pendapatan: [] };
    
    const promises = [
        fetchCSVData('gaji'),
        fetchCSVData('spj'),
        fetchCSVData('pendapatan')
    ];
    
    Promise.all(promises)
        .then(results => {
            let hasData = false;
            
            results.forEach((result, index) => {
                const keys = ['gaji', 'spj', 'pendapatan'];
                if (result.success && result.data.length > 0) {
                    dataArsip[keys[index]] = result.data;
                    hasData = true;
                    console.log(`✅ Data ${keys[index]} dimuat: ${result.data.length} entri (real)`);
                } else {
                    console.warn(`⚠️ Gagal memuat data ${keys[index]}:`, result.error || 'Data kosong');
                }
            });
            
            // Jika tidak ada data sama sekali, tampilkan pesan
            if (!hasData) {
                statusEl.innerHTML = '<i class="fas fa-info-circle" style="color:#f39c12;"></i> Belum ada data di spreadsheet';
                showEmptyData();
            } else {
                updateDashboard();
                performSearch();
                
                const now = new Date();
                const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                document.getElementById('lastUpdate').innerHTML = `<i class="fas fa-clock"></i> Diperbarui: ${timeStr}`;
                
                const totalData = getAllData().length;
                statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#06d6a0;"></i> ${totalData} data real dimuat`;
            }
            
            isLoading = false;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Gagal memuat data real';
            showErrorData();
            isLoading = false;
        });
}

// ============================================
// FUNGSI FETCH CSV DATA
// ============================================
async function fetchCSVData(type) {
    try {
        const csvUrl = CONFIG.csvUrls[type];
        if (!csvUrl) {
            return { success: false, data: [], error: 'CSV URL not configured' };
        }
        
        console.log(`📊 Mengambil data ${type} dari CSV real:`, csvUrl.substring(0, 60) + '...');
        
        // Gunakan fetch dengan mode untuk menghindari CORS jika perlu
        const response = await fetch(csvUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log(`📄 CSV ${type} diterima, panjang: ${csvText.length} karakter`);
        
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        console.log(`📊 Jumlah baris CSV ${type}: ${rows.length}`);
        
        if (rows.length <= 1) {
            return { success: true, data: [] };
        }
        
        const data = parseCSVData(rows, type);
        return { success: true, data: data };
        
    } catch (error) {
        console.warn(`Error fetching ${type} data:`, error.message);
        return { success: false, data: [], error: error.message };
    }
}

// ============================================
// FUNGSI PARSE CSV DATA
// ============================================
function parseCSVData(rows, type) {
    const data = [];
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Deteksi header
    let startRow = 0;
    const firstRow = rows[0] || '';
    const firstRowLower = firstRow.toLowerCase();
    
    // Cek apakah baris pertama adalah header
    if (firstRowLower.includes('nomor') || firstRowLower.includes('no') || 
        firstRowLower.includes('dokumen') || firstRowLower.includes('tanggal') ||
        firstRowLower.includes('status') || firstRowLower.includes('nama') ||
        firstRowLower.includes('timestamp') || firstRowLower.includes('waktu')) {
        startRow = 1;
        console.log(`📋 Header detected di ${type}, skip baris 0`);
    }
    
    for (let i = startRow; i < rows.length; i++) {
        const cols = parseCSVRow(rows[i]);
        
        // Skip baris kosong
        if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) {
            continue;
        }
        
        // Ambil data - kolom 0 = nomor, 1 = tanggal, 2 = status
        const nomor = cols[0]?.trim() || `-`;
        const tanggal = cols[1]?.trim() || new Date().toISOString().split('T')[0];
        const status = cols[2]?.trim() || CONFIG.defaultStatus || 'Diproses';
        
        // Jangan tambahkan data jika nomor kosong
        if (nomor === '-' || nomor.length < 2) continue;
        
        // Cek apakah ini baris header (jika tidak terdeteksi sebelumnya)
        if (nomor.toLowerCase().includes('nomor') || nomor.toLowerCase().includes('no')) {
            continue;
        }
        
        // Format tanggal
        const formattedDate = formatDate(tanggal);
        
        data.push({
            id: Date.now() + i,
            nomor: nomor,
            tanggal: formattedDate,
            status: status,
            jenis: typeLabel,
            nama: cols[3]?.trim() || '-',
            nilai: cols[4]?.trim() || '-'
        });
    }
    
    console.log(`📊 Data ${type} parsed: ${data.length} entri (real)`);
    return data;
}

// ============================================
// FUNGSI PARSE CSV ROW (Handle koma dalam string)
// ============================================
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(c => c.trim());
}

// ============================================
// FUNGSI FORMAT DATE
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
        // Coba parse sebagai Date
        let date = new Date(dateStr);
        if (!isNaN(date) && dateStr !== 'Invalid Date') {
            return date.toISOString().split('T')[0];
        }
        // Coba format DD/MM/YYYY atau MM/DD/YYYY
        const parts = dateStr.split(/[\/\-.]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
            if (parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

// ============================================
// TAMPILKAN DATA KOSONG
// ============================================
function showEmptyData() {
    const message = `
        <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-light);">
            <i class="fas fa-inbox" style="font-size:2rem; color:#f39c12; display:block; margin-bottom:0.5rem;"></i>
            <strong>Belum ada data di spreadsheet</strong><br>
            <span style="font-size:0.85rem;">
                Silakan isi formulir Google Form terlebih dahulu.<br>
                Setelah mengisi, data akan otomatis muncul di dashboard.
            </span>
            <div style="margin-top:0.8rem;">
                <a href="../indexx.html#arsip" class="btn btn-sm" style="font-size:0.8rem;">
                    <i class="fas fa-pen-to-square"></i> Isi Arsip Sekarang
                </a>
                <button class="btn btn-sm btn-outline" style="margin-left:0.5rem; font-size:0.8rem;" onclick="fetchDataFromSpreadsheet()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </td></tr>
    `;
    
    document.getElementById('tableBody').innerHTML = message;
    document.getElementById('searchResultBody').innerHTML = message;
    document.getElementById('allDataBody').innerHTML = message;
}

// ============================================
// TAMPILKAN DATA ERROR
// ============================================
function showErrorData() {
    const message = `
        <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-light);">
            <i class="fas fa-exclamation-circle" style="font-size:2rem; color:#e74c3c; display:block; margin-bottom:0.5rem;"></i>
            <strong>Gagal mengambil data dari spreadsheet</strong><br>
            <span style="font-size:0.85rem;">
                Pastikan Anda menggunakan Live Server (http://localhost)<br>
                dan spreadsheet sudah dipublikasikan dengan benar.
            </span>
            <div style="margin-top:0.5rem;">
                <button class="btn btn-sm btn-outline" onclick="fetchDataFromSpreadsheet()">
                    <i class="fas fa-sync-alt"></i> Coba lagi
                </button>
            </div>
        </td></tr>
    `;
    
    document.getElementById('tableBody').innerHTML = message;
    document.getElementById('searchResultBody').innerHTML = message;
    document.getElementById('allDataBody').innerHTML = message;
}

// ============================================
// FUNGSI GET ALL DATA
// ============================================
function getAllData() {
    return [
        ...dataArsip.gaji.map(d => ({ ...d, jenis: 'Gaji' })),
        ...dataArsip.spj.map(d => ({ ...d, jenis: 'SPJ' })),
        ...dataArsip.pendapatan.map(d => ({ ...d, jenis: 'Pendapatan' }))
    ];
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    const totalGaji = dataArsip.gaji.length;
    const totalSpj = dataArsip.spj.length;
    const totalPendapatan = dataArsip.pendapatan.length;
    const totalAll = totalGaji + totalSpj + totalPendapatan;

    document.getElementById('totalArsip').textContent = totalAll;
    document.getElementById('totalGaji').textContent = totalGaji;
    document.getElementById('totalSpj').textContent = totalSpj;
    document.getElementById('totalPendapatan').textContent = totalPendapatan;

    updateTable();
    updateAllDataTable();
    updateCharts();
    updateStatusCounts();
}

function updateStatusCounts() {
    const allData = getAllData();
    const selesai = allData.filter(d => d.status === 'Selesai').length;
    const diproses = allData.filter(d => d.status === 'Diproses').length;
    const pending = allData.filter(d => d.status === 'Pending').length;

    document.getElementById('totalDataAll').textContent = allData.length;
    document.getElementById('countSelesai').textContent = selesai;
    document.getElementById('countDiproses').textContent = diproses;
    document.getElementById('countPending').textContent = pending;
}

// ============================================
// TABLE DATA
// ============================================
function updateTable() {
    const tbody = document.getElementById('tableBody');
    const allData = getAllData().sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    document.getElementById('totalDataTabel').textContent = allData.length + ' entri';

    if (allData.length === 0) {
        showEmptyData();
        return;
    }

    tbody.innerHTML = allData.slice(0, 10).map((item, index) => {
        let statusClass = '';
        if (item.status === 'Selesai') statusClass = '';
        else if (item.status === 'Diproses') statusClass = 'process';
        else if (item.status === 'Pending') statusClass = 'pending';
        
        const deskripsi = item.nama && item.nama !== '-' ? ` (${item.nama})` : '';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td><strong>${item.nomor}</strong>${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline" style="padding:0.15rem 0.8rem; font-size:0.7rem;" onclick="alert('Detail: ${item.nomor}\\nJenis: ${item.jenis}\\nTanggal: ${item.tanggal}\\nStatus: ${item.status}\\nDeskripsi: ${item.nama || '-'}\\nNilai: ${item.nilai || '-'}')">Detail</a>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAllDataTable() {
    const tbody = document.getElementById('allDataBody');
    const allData = getAllData().sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    if (allData.length === 0) {
        showEmptyData();
        return;
    }

    tbody.innerHTML = allData.map((item, index) => {
        let statusClass = '';
        if (item.status === 'Selesai') statusClass = '';
        else if (item.status === 'Diproses') statusClass = 'process';
        else if (item.status === 'Pending') statusClass = 'pending';
        
        const deskripsi = item.nama && item.nama !== '-' ? ` (${item.nama})` : '';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td><strong>${item.nomor}</strong>${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline" style="padding:0.15rem 0.8rem; font-size:0.7rem;" onclick="return false;">Detail</a>
                    <a href="#" class="btn btn-sm" style="padding:0.15rem 0.8rem; font-size:0.7rem; background:#06d6a0;" onclick="return false;"><i class="fas fa-edit"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// CHARTS (DARI DATA REAL)
// ============================================
function updateCharts() {
    const totalGaji = dataArsip.gaji.length;
    const totalSpj = dataArsip.spj.length;
    const totalPendapatan = dataArsip.pendapatan.length;

    // Chart Jenis
    const ctxJenis = document.getElementById('chartJenis').getContext('2d');
    if (chartJenis) chartJenis.destroy();
    chartJenis = new Chart(ctxJenis, {
        type: 'bar',
        data: {
            labels: ['Gaji', 'SPJ', 'Pendapatan'],
            datasets: [{
                label: 'Jumlah Arsip',
                data: [totalGaji, totalSpj, totalPendapatan],
                backgroundColor: ['#4361ee', '#06d6a0', '#ffd166'],
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });

    // Chart Tren
    const trenData = generateTrenData();
    const ctxTren = document.getElementById('chartTren').getContext('2d');
    if (chartTren) chartTren.destroy();
    chartTren = new Chart(ctxTren, {
        type: 'line',
        data: {
            labels: trenData.labels,
            datasets: [
                { label: 'Gaji', data: trenData.gaji, borderColor: '#4361ee', backgroundColor: 'rgba(67,97,238,0.05)', tension: 0.3, fill: true },
                { label: 'SPJ', data: trenData.spj, borderColor: '#06d6a0', backgroundColor: 'rgba(6,214,160,0.05)', tension: 0.3, fill: true },
                { label: 'Pendapatan', data: trenData.pendapatan, borderColor: '#ffd166', backgroundColor: 'rgba(255,209,102,0.05)', tension: 0.3, fill: true }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 9 } } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 2, font: { size: 9 } } },
                x: { ticks: { font: { size: 9 } } }
            }
        }
    });

    // Chart Status
    const statusCounts = { Selesai: 0, Diproses: 0, Pending: 0 };
    getAllData().forEach(d => {
        if (d.status === 'Selesai') statusCounts.Selesai++;
        else if (d.status === 'Diproses') statusCounts.Diproses++;
        else if (d.status === 'Pending') statusCounts.Pending++;
    });

    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    if (chartStatus) chartStatus.destroy();
    chartStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Selesai', 'Diproses', 'Pending'],
            datasets: [{
                data: [statusCounts.Selesai, statusCounts.Diproses, statusCounts.Pending],
                backgroundColor: ['#06d6a0', '#ffd166', '#ef476f'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
            },
            cutout: '65%'
        }
    });
}

// ============================================
// GENERATE TREN DATA (DARI DATA REAL)
// ============================================
function generateTrenData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
    const result = { labels: months, gaji: [], spj: [], pendapatan: [] };
    
    ['gaji', 'spj', 'pendapatan'].forEach(jenis => {
        const data = dataArsip[jenis] || [];
        const monthCount = {};
        
        data.forEach(item => {
            if (item.tanggal && item.tanggal !== '-') {
                const parts = item.tanggal.split('-');
                if (parts.length === 3) {
                    const month = parseInt(parts[1]) - 1;
                    if (month >= 0 && month < 6) {
                        monthCount[month] = (monthCount[month] || 0) + 1;
                    }
                }
            }
        });
        
        for (let i = 0; i < 6; i++) {
            result[jenis].push(monthCount[i] || 0);
        }
    });
    
    return result;
}

// ============================================
// PENCARIAN
// ============================================
function performSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    const jenisFilter = document.getElementById('searchType').value;
    const statusFilter = document.getElementById('searchStatus').value;

    let data = getAllData();

    if (keyword) {
        data = data.filter(item =>
            item.nomor.toLowerCase().includes(keyword) ||
            item.jenis.toLowerCase().includes(keyword) ||
            item.status.toLowerCase().includes(keyword) ||
            (item.nama && item.nama.toLowerCase().includes(keyword)) ||
            item.tanggal.includes(keyword)
        );
    }

    if (jenisFilter !== 'all') {
        data = data.filter(item => item.jenis === jenisFilter);
    }

    if (statusFilter !== 'all') {
        data = data.filter(item => item.status === statusFilter);
    }

    const tbody = document.getElementById('searchResultBody');
    const noResult = document.getElementById('noResult');
    const resultCount = document.getElementById('resultCount');
    const totalResult = document.getElementById('totalSearchResult');

    resultCount.textContent = data.length;
    totalResult.textContent = data.length + ' hasil';

    if (data.length === 0) {
        tbody.innerHTML = '';
        noResult.style.display = 'block';
        return;
    }

    noResult.style.display = 'none';

    tbody.innerHTML = data.map((item, index) => {
        let statusClass = '';
        if (item.status === 'Selesai') statusClass = '';
        else if (item.status === 'Diproses') statusClass = 'process';
        else if (item.status === 'Pending') statusClass = 'pending';

        let nomorDisplay = item.nomor;
        if (keyword) {
            const regex = new RegExp(keyword, 'gi');
            nomorDisplay = nomorDisplay.replace(regex, match => `<span class="highlight">${match}</span>`);
        }
        
        const deskripsi = item.nama && item.nama !== '-' ? ` (${item.nama})` : '';

        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td>${nomorDisplay}${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td><a href="#" class="btn btn-sm btn-outline" style="padding:0.15rem 0.8rem; font-size:0.7rem;" onclick="return false;">Detail</a></td>
            </tr>
        `;
    }).join('');
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchType').value = 'all';
    document.getElementById('searchStatus').value = 'all';
    setFilter('all');
    performSearch();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === filter) {
            chip.classList.add('active');
        }
    });
    document.getElementById('searchType').value = filter === 'all' ? 'all' : filter;
    performSearch();
}

// ============================================
// EKSPOR CSV
// ============================================
function exportCSV() {
    const allData = getAllData();
    if (allData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }
    
    const headers = ['No', 'Jenis Arsip', 'Nomor Dokumen', 'Tanggal', 'Status', 'Deskripsi', 'Nilai'];
    const rows = allData.map((item, index) => [
        index + 1,
        item.jenis,
        item.nomor,
        item.tanggal,
        item.status,
        item.nama || '-',
        item.nilai || '-'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sipadi_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ============================================
// NAVIGASI PAGE
// ============================================
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (!this.dataset.page) return;
        
        e.preventDefault();

        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

        const pageId = this.dataset.page;
        const targetPage = document.getElementById('page-' + pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        if (pageId === 'dashboard') {
            setTimeout(() => {
                if (chartJenis) chartJenis.resize();
                if (chartTren) chartTren.resize();
                if (chartStatus) chartStatus.resize();
            }, 150);
        }
    });
});

// ============================================
// INISIALISASI
// ============================================
console.log('✅ SIPADI Admin Panel siap - Tanpa Data Dummy!');
console.log('📌 Gunakan username: admin | password: admin123');
console.log('📊 Mengambil data real dari Google Spreadsheet:');
console.log('  - Gaji:', CONFIG.csvUrls.gaji.substring(0, 50) + '...');
console.log('  - SPJ:', CONFIG.csvUrls.spj.substring(0, 50) + '...');
console.log('  - Pendapatan:', CONFIG.csvUrls.pendapatan.substring(0, 50) + '...');

// Auto-fetch data saat halaman dimuat
setTimeout(() => {
    fetchDataFromSpreadsheet();
}, 500);