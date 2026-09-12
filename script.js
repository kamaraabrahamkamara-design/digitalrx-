// --- CORE DATA ARCHITECTURE ---
const REQUIRED_COLUMNS = ["id", "class", "subject", "period", "semester", "grade"];
const DEFAULT_MOCK_DATA = [
    {"id": "STU1001", "class": "Grade_11A", "subject": "Mathematics", "period": "Quarter_1", "semester": "Semester_1", "grade": "92"},
    {"id": "STU1001", "class": "Grade_11A", "subject": "English_Lit", "period": "Quarter_1", "semester": "Semester_1", "grade": "88"},
    {"id": "STU1002", "class": "Grade_11B", "subject": "Mathematics", "period": "Quarter_1", "semester": "Semester_1", "grade": "79"}
];

// Initialize persistent browser memory
function initializeDatabase() {
    if (!localStorage.getItem("grades_database")) {
        localStorage.setItem("grades_database", JSON.stringify(DEFAULT_MOCK_DATA));
    }
}
initializeDatabase();

function getDatabase() {
    return JSON.parse(localStorage.getItem("grades_database")) || [];
}

function saveDatabase(data) {
    localStorage.setItem("grades_database", JSON.stringify(data));
}

function resetDatabase() {
    if (confirm("Are you sure you want to clear current logs and reset the database?")) {
        localStorage.setItem("grades_database", JSON.stringify(DEFAULT_MOCK_DATA));
        refreshAdminDatabaseTable();
        const statusDiv = document.getElementById('upload-status');
        if (statusDiv) {
            statusDiv.className = "mt-3 text-sm font-medium text-blue-600";
            statusDiv.innerText = "🔄 System database restored to factory defaults.";
        }
    }
}

// --- PORTAL NAVIGATION CONTROLLER ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active', 'text-blue-600', 'border-blue-500'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.add('text-gray-500', 'border-transparent'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));

    if (tab === 'student') {
        const studentBtn = document.getElementById('student-tab-btn');
        const studentPortal = document.getElementById('student-portal');
        if (studentBtn) studentBtn.classList.add('active');
        if (studentPortal) studentPortal.classList.remove('hidden');
    } else {
        const adminBtn = document.getElementById('admin-tab-btn');
        const adminPortal = document.getElementById('admin-portal');
        if (adminBtn) adminBtn.classList.add('active');
        if (adminPortal) adminPortal.classList.remove('hidden');
    }
}

// --- STUDENT SUB-SYSTEM CONTROLLERS ---
let currentStudentId = "";

function handleStudentLogin() {
    const studentIdInput = document.getElementById('student-id-input').value.trim();
    const statusDiv = document.getElementById('student-login-status');
    const panel = document.getElementById('student-panel');

    if (!studentIdInput) {
        statusDiv.className = "mt-3 text-sm font-medium text-yellow-600";
        statusDiv.innerText = "⚠️ Student ID cannot be empty.";
        if (panel) panel.classList.add('hidden');
        return;
    }

    const db = getDatabase();
    const studentRows = db.filter(row => String(row.id).trim() === studentIdInput);

    if (studentRows.length > 0) {
        currentStudentId = studentIdInput;
        statusDiv.className = "mt-3 text-sm font-medium text-green-600";
        statusDiv.innerText = `✅ Welcome Back Student: ${studentIdInput}`;
        
        populateDropdowns(studentRows);
        filterStudentData();
        if (panel) panel.classList.remove('hidden');
    } else {
        statusDiv.className = "mt-3 text-sm font-medium text-red-600";
        statusDiv.innerText = "❌ Student ID not found in current logs.";
        if (panel) panel.classList.add('hidden');
    }
}

function populateDropdowns(rows) {
    const semDropdown = document.getElementById('semester-dropdown');
    const perDropdown = document.getElementById('period-dropdown');

    if (!semDropdown || !perDropdown) return;

    const uniqueSemesters = [...new Set(rows.map(r => r.semester).filter(Boolean))].sort();
    const uniquePeriods = [...new Set(rows.map(r => r.period).filter(Boolean))].sort();

    semDropdown.innerHTML = '<option value="All Semesters">All Semesters</option>';
    perDropdown.innerHTML = '<option value="All Periods">All Periods</option>';

    uniqueSemesters.forEach(sem => {
        semDropdown.innerHTML += `<option value="${sem}">${sem}</option>`;
    });
    uniquePeriods.forEach(per => {
        perDropdown.innerHTML += `<option value="${per}">${per}</option>`;
    });
}

function getFilteredStudentRows() {
    const db = getDatabase();
    let studentRows = db.filter(row => String(row.id).trim() === currentStudentId);

    const semDropdown = document.getElementById('semester-dropdown');
    const perDropdown = document.getElementById('period-dropdown');

    const selectedSemester = semDropdown ? semDropdown.value : "All Semesters";
    const selectedPeriod = perDropdown ? perDropdown.value : "All Periods";

    if (selectedSemester && selectedSemester !== "All Semesters") {
        studentRows = studentRows.filter(r => r.semester === selectedSemester);
    }
    if (selectedPeriod && selectedPeriod !== "All Periods") {
        studentRows = studentRows.filter(r => r.period === selectedPeriod);
    }

    return studentRows;
}

function filterStudentData() {
    const filteredRows = getFilteredStudentRows();
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = "";

    filteredRows.forEach(row => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b border-gray-100 font-medium">${row.id}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.class}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.subject}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.period}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.semester}</td>
                <td class="px-4 py-2 border-b border-gray-100 font-semibold text-blue-600">${row.grade}</td>
            </tr>
        `;
    });
    
    const fileContainer = document.getElementById('file-output-container');
    if (fileContainer) fileContainer.classList.add('hidden');
}

function exportStudentCSV() {
    const rowsToExport = getFilteredStudentRows();
    if (rowsToExport.length === 0) return;

    let csvContent = REQUIRED_COLUMNS.join(",") + "\n";
    rowsToExport.forEach(row => {
        const line = REQUIRED_COLUMNS.map(col => `"${row[col] || ''}"`).join(",");
        csvContent += line + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const filename = `ReportCard_${currentStudentId}.csv`;
    const downloadLink = document.getElementById('file-download-link');
    const fileNameSpan = document.getElementById('download-file-name');
    const fileContainer = document.getElementById('file-output-container');
    
    if (downloadLink) {
        downloadLink.href = url;
        downloadLink.download = filename;
    }
    
    if (fileNameSpan) fileNameSpan.innerText = filename;
    if (fileContainer) {
        fileContainer.style.display = 'inline-flex';
        fileContainer.classList.remove('hidden');
    }
}

// --- ADMINISTRATIVE MANAGEMENT CONTROLLERS ---
function handleAdminLogin() {
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;
    const statusDiv = document.getElementById('admin-login-status');
    const panel = document.getElementById('admin-panel');

    if (user === "admin" && pass === "password123") {
        statusDiv.className = "mt-3 text-sm font-medium text-green-600";
        statusDiv.innerText = "✅ Admin Authentication Successful. Live database loaded below.";
        
        refreshAdminDatabaseTable();
        if (panel) panel.classList.remove('hidden');
    } else {
        statusDiv.className = "mt-3 text-sm font-medium text-red-600";
        statusDiv.innerText = "❌ Invalid Admin Username or Password.";
        if (panel) panel.classList.add('hidden');
    }
}

function refreshAdminDatabaseTable() {
    const db = getDatabase();
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = "";

    db.forEach(row => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b border-gray-100 font-medium">${row.id}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.class}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.subject}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.period}</td>
                <td class="px-4 py-2 border-b border-gray-100">${row.semester}</td>
                <td class="px-4 py-2 border-b border-gray-100 font-semibold">${row.grade}</td>
            </tr>
        `;
    });
}

function handleCSVUpload() {
    const fileInput = document.getElementById('csv-file-input');
    const statusDiv = document.getElementById('upload-status');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        statusDiv.className = "mt-3 text-sm font-medium text-yellow-600";
        statusDiv.innerText = "⚠️ Please upload a valid CSV file first.";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            if (lines.length < 2) throw new Error("File missing basic row records.");

            const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
            
            const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
            if (missing.length > 0) {
                statusDiv.className = "mt-3 text-sm font-medium text-red-600";
                statusDiv.innerText = `❌ Upload Rejected. Missing required columns: { ${missing.join(', ')} }`;
                return;
            }

            const freshRecords = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
                if (values.length !== headers.length) continue;

                let rowObject = {};
                REQUIRED_COLUMNS.forEach(col => {
                    const indexInCsv = headers.indexOf(col);
                    rowObject[col] = values[indexInCsv];
                });
                freshRecords.push(rowObject);
            }

            let currentDb = getDatabase();
            let updatedDb = [...currentDb];
            let importedCount = 0;

            freshRecords.forEach(newRec => {
                const isDuplicate = currentDb.some(oldRec => 
                    REQUIRED_COLUMNS.every(col => String(oldRec[col]) === String(newRec[col]))
                );
                if (!isDuplicate) {
                    updatedDb.push(newRec);
                    importedCount++;
                }
            });

            saveDatabase(updatedDb);
            refreshAdminDatabaseTable();

            statusDiv.className = "mt-3 text-sm font-medium text-green-600";
            statusDiv.innerText = `🎉 Success! Merged ${importedCount} records into the system database.`;
            fileInput.value = ""; 

        } catch (err) {
            statusDiv.className = "mt-3 text-sm font-medium text-red-600";
            statusDiv.innerText = `❌ Engine failure parsing file: ${err.message}`;
        }
    };

    reader.readAsText(file);
}
