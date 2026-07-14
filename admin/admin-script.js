/**
 * ============================================
 * ADMIN SCRIPT - SIPADI Dinas PUPR TTS
 * Data Real dari Google Spreadsheet (CSV Export)
 * Fitur: Hapus Data, Buka File, & Download File
 * ============================================
 */

// ============================================
// ★★★ KOSONGKAN FIELD LOGIN SAAT LOAD ★★★
// ============================================
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', clearLoginFields);
    } else {
        clearLoginFields();
    }
    
    function clearLoginFields() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        if (usernameField) {
            usernameField.value = '';
            usernameField.setAttribute('autocomplete', 'off');
            setTimeout(() => { usernameField.value = ''; }, 50);
            setTimeout(() => { usernameField.value = ''; }, 200);
            setTimeout(() => { usernameField.value = ''; }, 500);
        }
        if (passwordField) {
            passwordField.value = '';
            passwordField.setAttribute('autocomplete', 'off');
            setTimeout(() => { passwordField.value = ''; }, 50);
            setTimeout(() => { passwordField.value = ''; }, 200);
            setTimeout(() => { passwordField.value = ''; }, 500);
        }
    }
})();

// ============================================
// KONFIGURASI - WEB APP URL TERBARU
// ============================================
const CONFIG = {
    // Link CSV publik untuk membaca data
    csvUrls: {
        gaji: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRHfk7N8mH_aqtXb5CkYgM-eljBJIAAJTZm64_DpjfJnPjVGr5XVEOfQULwU9WnPdSW19HTK7kPvBy/pub?output=csv',
        spj: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRn_PZVaLhCSrdT6nNOLmXLBKwiGIke69_9mZUD0wq0Wjv-4BY7sfKgsvJTQjiV-UpnVIyJfoBFyPux/pub?output=csv',
        pendapatan: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0DzeTB-OsTHj7_-38kzUNZKM-d1uo8rUuSXDFZXKt3yQYdDRKFyZnZhqIL3dzA9ROuns4Zpr8rASp/pub?output=csv'
    },
    
    // Spreadsheet ID untuk operasi hapus
    spreadsheetIds: {
        gaji: '1oR0s0nukj1kRH777unUtAm-YZL7lXiIxunYfvb5u9S0',
        spj: '13HtzcwDZzHFL6x1o6Faq0O-n9Vxfbd9HE7z0GYPq9GU',
        pendapatan: '1ZS2ljK47mtjlB-1Wv27X9hFA5WgV-DFgh_7exhm76Iw'
    },
    
    // ★★★ WEB APP URL TERBARU ★★★
    webAppUrls: {
        gaji: 'https://script.google.com/macros/s/AKfycbyPT3E4x3s4dymNiR35LCFYhGJqwLDIQIhPNmIcwvVyeteBQt2i1isq-W_L8PgeOJAZ9w/exec',
        spj: 'https://script.google.com/macros/s/AKfycbyg5h6Arqo9A3PBO--JkSfyzzZy5iHSI4xDQ5vPz_dnLBFkm4O418rd6IXhfjno6FpiNg/exec',
        pendapatan: 'https://script.google.com/macros/s/AKfycbzws_VrZ7xd3PATgTsN2k0taqWqBT6IeR_ZhyA7f2sacNUWVai6shF2-TB2ocoGZEAUkQ/exec'
    },
    
    // ★★★ NAMA SHEET YANG BENAR ★★★
    sheetName: 'Form Responses 1',
    
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
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// ============================================
// FUNGSI LOGOUT
// ============================================
function handleLogout() {
    if (confirm('Yakin ingin keluar dari Admin Panel?')) {
        document.getElementById('adminPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// ============================================
// FUNGSI FETCH DATA DARI CSV
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
        let csvUrl = CONFIG.csvUrls[type];
        if (!csvUrl) {
            return { success: false, data: [], error: 'CSV URL not configured' };
        }
        
        // ★★★ PERBAIKI: Tambahkan cache buster dengan '&' bukan '?' ★★★
        if (csvUrl.includes('?')) {
            csvUrl += '&t=' + Date.now();
        } else {
            csvUrl += '?t=' + Date.now();
        }
        
        console.log(`📊 Mengambil data ${type} dari CSV:`, csvUrl.substring(0, 80) + '...');
        
        const response = await fetch(csvUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) {
            // Fallback tanpa cache buster
            console.warn(`⚠️ Gagal dengan cache buster, mencoba tanpa parameter...`);
            const fallbackUrl = CONFIG.csvUrls[type];
            const fallbackResponse = await fetch(fallbackUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv'
                }
            });
            
            if (!fallbackResponse.ok) {
                throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
            }
            
            const fallbackText = await fallbackResponse.text();
            const fallbackRows = fallbackText.split('\n').filter(row => row.trim() !== '');
            
            if (fallbackRows.length <= 1) {
                return { success: true, data: [] };
            }
            
            const fallbackData = parseCSVData(fallbackRows, type);
            return { success: true, data: fallbackData };
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
        
        // ★★★ FALLBACK: Coba tanpa cache buster ★★★
        try {
            console.log(`🔄 Mencoba fallback tanpa cache buster untuk ${type}...`);
            const fallbackUrl = CONFIG.csvUrls[type];
            const fallbackResponse = await fetch(fallbackUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv'
                }
            });
            
            if (!fallbackResponse.ok) {
                throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
            }
            
            const fallbackText = await fallbackResponse.text();
            const fallbackRows = fallbackText.split('\n').filter(row => row.trim() !== '');
            
            if (fallbackRows.length <= 1) {
                return { success: true, data: [] };
            }
            
            const fallbackData = parseCSVData(fallbackRows, type);
            console.log(`✅ Fallback berhasil untuk ${type}: ${fallbackData.length} entri`);
            return { success: true, data: fallbackData };
            
        } catch (fallbackError) {
            console.warn(`Fallback juga gagal untuk ${type}:`, fallbackError.message);
            return { success: false, data: [], error: error.message };
        }
    }
}

// ============================================
// FUNGSI PARSE CSV DATA
// ============================================
function parseCSVData(rows, type) {
    const data = [];
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    
    let startRow = 0;
    const firstRow = rows[0] || '';
    const firstRowLower = firstRow.toLowerCase();
    
    // Deteksi header
    let colMap = {};
    
    if (firstRowLower.includes('timestamp') || firstRowLower.includes('waktu') || 
        firstRowLower.includes('nomor') || firstRowLower.includes('no')) {
        startRow = 1;
        const headerCols = parseCSVRow(rows[0]);
        
        // Mapping kolom berdasarkan jenis arsip
        const columnMappings = {
            gaji: {
                timestamp: ['timestamp', 'waktu', 'tgl'],
                nomor: ['nomor', 'no', 'nip', 'id'],
                tanggal: ['tanggal', 'tgl', 'date'],
                status: ['status', 'keterangan'],
                nama: ['nama', 'pegawai', 'name'],
                nilai: ['total', 'gaji', 'jumlah', 'nilai'],
                fileLink: ['file', 'link', 'upload', 'dokumen', 'attachment']
            },
            spj: {
                timestamp: ['timestamp', 'waktu', 'tgl'],
                nomor: ['nomor', 'no', 'spj', 'id'],
                tanggal: ['tanggal', 'tgl', 'date'],
                status: ['status', 'keterangan'],
                nama: ['nama', 'kegiatan', 'uraian'],
                nilai: ['nilai', 'total', 'jumlah'],
                fileLink: ['file', 'link', 'upload', 'dokumen', 'attachment']
            },
            pendapatan: {
                timestamp: ['timestamp', 'waktu', 'tgl'],
                nomor: ['nomor', 'no', 'id'],
                tanggal: ['tanggal', 'tgl', 'date'],
                status: ['status', 'keterangan'],
                nama: ['sumber', 'nama', 'uraian'],
                nilai: ['jumlah', 'total', 'nilai'],
                fileLink: ['file', 'link', 'upload', 'dokumen', 'attachment']
            }
        };
        
        const mappings = columnMappings[type] || columnMappings.gaji;
        
        // Cari index untuk setiap kolom
        headerCols.forEach((col, idx) => {
            const lower = col.toLowerCase().trim();
            
            if (mappings.timestamp.some(k => lower.includes(k))) {
                colMap.timestamp = idx;
            } else if (mappings.nomor.some(k => lower.includes(k))) {
                colMap.nomor = idx;
            } else if (mappings.tanggal.some(k => lower.includes(k))) {
                colMap.tanggal = idx;
            } else if (mappings.status.some(k => lower.includes(k))) {
                colMap.status = idx;
            } else if (mappings.nama.some(k => lower.includes(k))) {
                colMap.nama = idx;
            } else if (mappings.nilai.some(k => lower.includes(k))) {
                colMap.nilai = idx;
            } else if (mappings.fileLink.some(k => lower.includes(k))) {
                colMap.fileLink = idx;
            }
        });
        
        // Default mapping jika tidak ada yang terdeteksi
        if (Object.keys(colMap).length === 0) {
            colMap = { timestamp: 0, nomor: 1, tanggal: 2, status: 3, nama: 4, nilai: 5, fileLink: 6 };
        }
        
        console.log(`📋 Kolom terdeteksi di ${type}:`, colMap);
    }
    
    for (let i = startRow; i < rows.length; i++) {
        const cols = parseCSVRow(rows[i]);
        
        if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) {
            continue;
        }
        
        // Ambil data dengan fallback ke posisi default
        const nomor = colMap.nomor !== undefined ? (cols[colMap.nomor]?.trim() || `-`) : (cols[1]?.trim() || `-`);
        const tanggalRaw = colMap.tanggal !== undefined ? (cols[colMap.tanggal]?.trim() || '') : (cols[2]?.trim() || '');
        const status = colMap.status !== undefined ? (cols[colMap.status]?.trim() || CONFIG.defaultStatus) : (cols[3]?.trim() || CONFIG.defaultStatus);
        const nama = colMap.nama !== undefined ? (cols[colMap.nama]?.trim() || '-') : (cols[4]?.trim() || '-');
        const nilai = colMap.nilai !== undefined ? (cols[colMap.nilai]?.trim() || '-') : (cols[5]?.trim() || '-');
        const fileLink = colMap.fileLink !== undefined ? (cols[colMap.fileLink]?.trim() || '') : (cols[6]?.trim() || '');
        
        // Skip jika nomor kosong atau header
        if (nomor === '-' || nomor.length < 2) continue;
        if (nomor.toLowerCase().includes('nomor') || nomor.toLowerCase().includes('no')) {
            continue;
        }
        
        // Format tanggal dengan lebih baik
        let formattedDate = formatDate(tanggalRaw);
        if (formattedDate === '-' || formattedDate === 'Invalid Date') {
            const timestamp = colMap.timestamp !== undefined ? (cols[colMap.timestamp]?.trim() || '') : (cols[0]?.trim() || '');
            formattedDate = formatDate(timestamp);
        }
        
        // Normalisasi status
        let normalizedStatus = status;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('lunas') || statusLower.includes('selesai') || statusLower.includes('sudah')) {
            normalizedStatus = 'Selesai';
        } else if (statusLower.includes('proses') || statusLower.includes('diproses') || statusLower.includes('berjalan')) {
            normalizedStatus = 'Diproses';
        } else if (statusLower.includes('pending') || statusLower.includes('tunda') || statusLower.includes('belum')) {
            normalizedStatus = 'Pending';
        }
        
        data.push({
            id: Date.now() + i,
            rowIndex: i,
            nomor: nomor,
            tanggal: formattedDate,
            status: normalizedStatus,
            jenis: typeLabel,
            nama: nama,
            nilai: nilai,
            fileLink: fileLink
        });
    }
    
    console.log(`📊 Data ${type} parsed: ${data.length} entri (real)`);
    return data;
}

// ============================================
// FUNGSI PARSE CSV ROW
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
        // Format: "18/06/2026 12:51:09 (18/06/2026)"
        let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            return `${match[3]}-${match[2]}-${match[1]}`;
        }
        
        // Format: "2026-06-18"
        match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        
        // Format: "18/06/2026"
        match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            return `${match[3]}-${match[2]}-${match[1]}`;
        }
        
        // Coba parse sebagai Date
        let date = new Date(dateStr);
        if (!isNaN(date) && dateStr !== 'Invalid Date') {
            return date.toISOString().split('T')[0];
        }
        
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

// ============================================
// FUNGSI HAPUS DATA (Via Google Apps Script Web App)
// ============================================
async function deleteDataFromSheet(type, rowIndex, nomor) {
    if (!confirm(`Yakin ingin menghapus data ${nomor}?`)) {
        return;
    }
    
    const statusEl = document.getElementById('dataStatus');
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus data dari spreadsheet...';
    
    try {
        // Validasi rowIndex
        if (rowIndex === undefined || rowIndex === null || rowIndex < 0) {
            throw new Error('Row index tidak valid');
        }
        
        // Hapus dari data lokal
        const index = dataArsip[type].findIndex(d => d.rowIndex === rowIndex && d.nomor === nomor);
        if (index !== -1) {
            dataArsip[type].splice(index, 1);
        }
        
        // Hapus dari spreadsheet via Web App
        const webAppUrl = CONFIG.webAppUrls[type];
        if (!webAppUrl) {
            throw new Error('Web App URL tidak ditemukan untuk jenis arsip ini');
        }
        
        const sheetId = CONFIG.spreadsheetIds[type];
        const sheetName = CONFIG.sheetName || 'Form Responses 1';
        
        const url = `${webAppUrl}?sheetId=${sheetId}&rowIndex=${rowIndex + 1}&action=delete&sheetName=${encodeURIComponent(sheetName)}`;
        
        console.log(`🗑️ Menghapus baris ${rowIndex + 1} dari ${type}`);
        console.log(`📡 URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Gagal menghapus data dari spreadsheet');
        }
        
        console.log(`✅ Baris ${rowIndex + 1} berhasil dihapus`);
        
        statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#06d6a0;"></i> Data ${nomor} berhasil dihapus dari spreadsheet`;
        updateDashboard();
        performSearch();
        
    } catch (error) {
        console.error('Error deleting data:', error);
        statusEl.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Gagal: ${error.message}`;
        alert(`❌ Gagal menghapus data dari spreadsheet!\n\nError: ${error.message}\n\nData tetap dihapus dari tampilan.`);
        updateDashboard();
        performSearch();
    }
}

// ============================================
// FUNGSI BUKA FILE UPLOAD
// ============================================
function openFileLink(fileLink, nomor) {
    if (!fileLink || fileLink === '') {
        alert(`Tidak ada file yang diupload untuk ${nomor}`);
        return;
    }
    window.open(fileLink, '_blank');
}

// ============================================
// FUNGSI DOWNLOAD FILE
// ============================================
function downloadFile(fileLink, nomor) {
    if (!fileLink || fileLink === '') {
        alert(`Tidak ada file yang diupload untuk ${nomor}`);
        return;
    }
    
    const statusEl = document.getElementById('dataStatus');
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunduh file...';
    
    try {
        fetch(fileLink)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                let filename = fileLink.split('/').pop().split('?')[0] || `file_${nomor}`;
                if (!filename.includes('.')) {
                    const ext = blob.type.split('/')[1] || 'bin';
                    filename = `${filename}.${ext}`;
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#06d6a0;"></i> File berhasil diunduh`;
                setTimeout(() => {
                    const totalData = getAllData().length;
                    statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#06d6a0;"></i> ${totalData} data real dimuat`;
                }, 3000);
            })
            .catch(error => {
                console.error('Error downloading file:', error);
                window.open(fileLink, '_blank');
                statusEl.innerHTML = `<i class="fas fa-info-circle" style="color:#f39c12;"></i> File dibuka di tab baru`;
                setTimeout(() => {
                    const totalData = getAllData().length;
                    statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:#06d6a0;"></i> ${totalData} data real dimuat`;
                }, 3000);
            });
            
    } catch (error) {
        console.error('Error:', error);
        alert(`❌ Gagal mengunduh file!\n\nError: ${error.message}`);
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Gagal mengunduh file';
    }
}

// ============================================
// FUNGSI DETAIL DATA
// ============================================
function showDetail(item) {
    const detailMsg = `📄 DETAIL ARSIP
━━━━━━━━━━━━━━━━━━━━
📌 Nomor Dokumen: ${item.nomor}
📁 Jenis Arsip: ${item.jenis}
📅 Tanggal: ${item.tanggal}
📊 Status: ${item.status}
👤 Deskripsi: ${item.nama || '-'}
💰 Nilai: ${item.nilai || '-'}
${item.fileLink ? `📎 File: ${item.fileLink}` : '📎 Tidak ada file'}
━━━━━━━━━━━━━━━━━━━━`;
    alert(detailMsg);
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
// TABLE DATA - DENGAN TOMBOL AKSI
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
        const hasFile = item.fileLink && item.fileLink !== '';
        
        const typeMap = { 'Gaji': 'gaji', 'SPJ': 'spj', 'Pendapatan': 'pendapatan' };
        const dataType = typeMap[item.jenis] || 'gaji';
        
        const itemJSON = JSON.stringify(item).replace(/"/g, '&quot;');
        const fileLinkSafe = item.fileLink ? item.fileLink.replace(/'/g, "\\'") : '';
        const nomorSafe = item.nomor ? item.nomor.replace(/'/g, "\\'") : '';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td><strong>${item.nomor}</strong>${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-aksi btn-detail" onclick="showDetail(${itemJSON})" title="Detail">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${hasFile ? `
                        <button class="btn-aksi btn-file" onclick="openFileLink('${fileLinkSafe}', '${nomorSafe}')" title="Buka File">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-aksi btn-download" onclick="downloadFile('${fileLinkSafe}', '${nomorSafe}')" title="Download File">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="btn-aksi btn-delete" onclick="deleteDataFromSheet('${dataType}', ${item.rowIndex}, '${nomorSafe}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
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
        const hasFile = item.fileLink && item.fileLink !== '';
        
        const typeMap = { 'Gaji': 'gaji', 'SPJ': 'spj', 'Pendapatan': 'pendapatan' };
        const dataType = typeMap[item.jenis] || 'gaji';
        
        const itemJSON = JSON.stringify(item).replace(/"/g, '&quot;');
        const fileLinkSafe = item.fileLink ? item.fileLink.replace(/'/g, "\\'") : '';
        const nomorSafe = item.nomor ? item.nomor.replace(/'/g, "\\'") : '';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td><strong>${item.nomor}</strong>${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-aksi btn-detail" onclick="showDetail(${itemJSON})" title="Detail">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${hasFile ? `
                        <button class="btn-aksi btn-file" onclick="openFileLink('${fileLinkSafe}', '${nomorSafe}')" title="Buka File">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-aksi btn-download" onclick="downloadFile('${fileLinkSafe}', '${nomorSafe}')" title="Download File">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="btn-aksi btn-edit" onclick="return false;" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-aksi btn-delete" onclick="deleteDataFromSheet('${dataType}', ${item.rowIndex}, '${nomorSafe}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// CHARTS
// ============================================
function updateCharts() {
    const totalGaji = dataArsip.gaji.length;
    const totalSpj = dataArsip.spj.length;
    const totalPendapatan = dataArsip.pendapatan.length;

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
// GENERATE TREN DATA
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
        const hasFile = item.fileLink && item.fileLink !== '';
        
        const typeMap = { 'Gaji': 'gaji', 'SPJ': 'spj', 'Pendapatan': 'pendapatan' };
        const dataType = typeMap[item.jenis] || 'gaji';
        
        const itemJSON = JSON.stringify(item).replace(/"/g, '&quot;');
        const fileLinkSafe = item.fileLink ? item.fileLink.replace(/'/g, "\\'") : '';
        const nomorSafe = item.nomor ? item.nomor.replace(/'/g, "\\'") : '';

        return `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${item.jenis}</span></td>
                <td>${nomorDisplay}${deskripsi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn-aksi btn-detail" onclick="showDetail(${itemJSON})" title="Detail">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${hasFile ? `
                        <button class="btn-aksi btn-file" onclick="openFileLink('${fileLinkSafe}', '${nomorSafe}')" title="Buka File">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-aksi btn-download" onclick="downloadFile('${fileLinkSafe}', '${nomorSafe}')" title="Download File">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="btn-aksi btn-delete" onclick="deleteDataFromSheet('${dataType}', ${item.rowIndex}, '${nomorSafe}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
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
    
    const headers = ['No', 'Jenis Arsip', 'Nomor Dokumen', 'Tanggal', 'Status', 'Deskripsi', 'Nilai', 'File Link'];
    const rows = allData.map((item, index) => [
        index + 1,
        item.jenis,
        item.nomor,
        item.tanggal,
        item.status,
        item.nama || '-',
        item.nilai || '-',
        item.fileLink || ''
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
console.log('✅ SIPADI Admin Panel siap!');
console.log('📌 Gunakan username: admin | password: admin123');
console.log('📊 Mengambil data real dari Google Spreadsheet:');
console.log('  - Gaji:', CONFIG.csvUrls.gaji.substring(0, 50) + '...');
console.log('  - SPJ:', CONFIG.csvUrls.spj.substring(0, 50) + '...');
console.log('  - Pendapatan:', CONFIG.csvUrls.pendapatan.substring(0, 50) + '...');
console.log('🗑️ Web App URL untuk hapus data:');
console.log('  - Gaji:', CONFIG.webAppUrls.gaji);
console.log('  - SPJ:', CONFIG.webAppUrls.spj);
console.log('  - Pendapatan:', CONFIG.webAppUrls.pendapatan);
console.log('📋 Nama Sheet:', CONFIG.sheetName);
console.log('📥 Fitur Download File: aktif');

// Auto-fetch data saat halaman dimuat
setTimeout(() => {
    fetchDataFromSpreadsheet();
}, 500);
