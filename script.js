// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMzWcjvTStYVHy-BxN2hpMTSQxCBN3nXk",
    authDomain: "excel-sheet-737fa.firebaseapp.com",
    projectId: "excel-sheet-737fa",
    storageBucket: "excel-sheet-737fa.appspot.com",
    messagingSenderId: "202807179886",
    appId: "1:202807179886:web:a3b4c83de711fc4648847f",
    measurementId: "G-YG34XVCJ3X"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firestore
  const db = firebase.firestore();
  
  // Function to handle tab switching
  function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }
  
// Function to load table data from Firestore
function loadTableData(tableId, collectionName) {
    const tableBody = document.getElementById(tableId + 'Body');
  
    // Check if the element exists
    if (!tableBody) {
      console.error(`Element with ID "${tableId}Body" not found.`);
      return; // Exit if the element is not found
    }
  
    tableBody.innerHTML = ""; // Clear the table to avoid duplication
  
    // Define the ordered list of keys that matches the table column order
    const orderedKeys = tableId === 'internalTaskTable'
      ? ['رقم', 'اسم_الموظف', 'المسمى_الوظيفي', 'مرحلة_التدريب', 'تاريخ_المهمة', 'رقم_المهمة', 'اسم_المهمة', 'مرفق_المهمة', 'رابط_المرفق', 'اسناد_المهمة', 'ملاحظات_الاسناد']
      : ['اسم_الموظف_عميل', 'المسمي_الوظيفي_عميل', 'مرحلة_التدريب_عميل', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];
  
    // Fetch data from Firestore
    db.collection(collectionName).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const row = document.createElement("tr");
  
        // Use the ordered list of keys to insert data in the correct column order
        orderedKeys.forEach(key => {
          const cell = document.createElement("td");
          if (key.includes('رابط')) {
            const link = document.createElement("a");
            link.href = task[key] || "#";
            link.textContent = "رابط";
            link.target = "_blank";
            cell.appendChild(link);
          } else if (typeof task[key] === 'boolean') {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task[key];
            checkbox.disabled = true; // Make the checkbox read-only
            cell.appendChild(checkbox);
          } else {
            cell.textContent = task[key] || ""; // Set empty string if key is missing
          }
          row.appendChild(cell);
        });
  
        tableBody.appendChild(row);
      });
    }).catch((error) => {
      console.error("Error loading data from Firestore: ", error);
    });
  }
  
  
  // Function to add a new row to Firestore
  function addRow(tableId) {
    const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
    const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';
  
    const form = document.getElementById(formId);
    const newRowData = Array.from(form.elements).reduce((data, element) => {
      if (element.tagName === 'INPUT') {
        data[element.id] = element.type === 'checkbox' ? element.checked : element.value;
      }
      return data;
    }, {});
  
    // Add data to Firestore
    db.collection(collectionName).add(newRowData)
      .then(() => {
        console.log("Document successfully written!");
        loadTableData(tableId, collectionName);
        form.reset();
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  }
  
  // Load data from Firestore when the page loads
  document.addEventListener("DOMContentLoaded", function() {
    loadTableData('internalTaskTable', 'internalTasks');
    loadTableData('clientTaskTable', 'clientTasks');
  
    // Open the first tab by default
    document.getElementsByClassName("tablinks")[0].click();
  });
  
  // Function to export table data to CSV
  function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tr');
    let csvContent = "\uFEFF"; // Adding BOM for UTF-8 encoding
  
    // Iterate over each row in the table
    rows.forEach((row) => {
      const cells = row.querySelectorAll('th, td');
      const rowData = [];
  
      // Iterate over each cell in the row
      cells.forEach((cell) => {
        let cellContent = cell.innerText.replace(/"/g, '""'); // Escape double quotes
        rowData.push(`"${cellContent}"`); // Wrap cell content in quotes
      });
  
      csvContent += rowData.join(",") + "\n"; // Join cells with commas and add a newline
    });
  
    // Create a blob from the CSV content and trigger a download
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = csvUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Function to filter tasks by month
function filterByMonth() {
    const selectedMonth = document.getElementById("monthFilter").value;
    const collectionName = 'clientTasks'; // Assuming you want to filter client tasks
  
    if (!selectedMonth) {
      // If no month is selected, load all data
      loadTableData('clientTaskTable', collectionName);
      return;
    }
  
    const tableBody = document.getElementById('clientTaskTableBody');
    tableBody.innerHTML = ""; // Clear the table before adding filtered data
  
    // Fetch data from Firestore and filter by month
    db.collection(collectionName).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const taskDate = new Date(task['تاريخ_المهمة_عميل']);
  
        // Extract month in two digits (01, 02, etc.)
        const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2);
  
        if (taskMonth === selectedMonth) {
          const row = document.createElement("tr");
  
          // Define the ordered list of keys to match table columns
          const orderedKeys = ['اسم_الموظف_عميل', 'المسمي_الوظيفي_عميل', 'مرحلة_التدريب_عميل', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];
  
          // Create table cells in the correct order
          orderedKeys.forEach(key => {
            const cell = document.createElement("td");
            if (key.includes('رابط')) {
              const link = document.createElement("a");
              link.href = task[key] || "#";
              link.textContent = "رابط";
              link.target = "_blank";
              cell.appendChild(link);
            } else if (typeof task[key] === 'boolean') {
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.checked = task[key];
              checkbox.disabled = true; // Make the checkbox read-only
              cell.appendChild(checkbox);
            } else {
              cell.textContent = task[key] || ""; // Set empty string if key is missing
            }
            row.appendChild(cell);
          });
  
          tableBody.appendChild(row);
        }
      });
    }).catch((error) => {
      console.error("Error filtering data by month from Firestore: ", error);
    });
  }
  