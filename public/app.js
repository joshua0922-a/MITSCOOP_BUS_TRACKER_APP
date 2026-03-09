const api = "https://mitscoop-backend-7gaplf01p-joshua0922-as-projects.vercel.app/"; // leave blank if same server

/* =============================== LOAD BUSES =============================== */
async function loadBuses() {
  const res = await fetch(api + "/api/buses");
  const buses = await res.json();
  const tbody = document.querySelector("#busTable tbody");
  tbody.innerHTML = "";

  let total = 0, onRoute = 0, inTerminal = 0, maintenance = 0, active = 0;

  buses.forEach(b => {
    total++;
    if (b.status === "On Route") onRoute++;
    else if (b.status === "In Terminal") inTerminal++;
    else if (b.status === "Maintenance") maintenance++;
    else active++;

    tbody.innerHTML += `
      <tr>
        <td>${b.bus_number}</td>
        <td>${b.plate_number || ""}</td>
        <td>${b.route || ""}</td>
        <td>${b.driver || ""}</td>
        <td>${b.conductor || ""}</td>
        <td>${b.status || "Active"}</td>
        <td>
          <button class="edit-btn" onclick="editBus(${b.id}, '${b.bus_number}', '${b.plate_number || ""}', '${b.route || ""}', '${b.driver || ""}', '${b.conductor || ""}', '${b.status || "Active"}')">Edit</button>
          <button class="delete-btn" onclick="deleteBus(${b.id})">Delete</button>
        </td>
      </tr>`;
  });

  document.getElementById("totalBuses").innerText = total;
  document.getElementById("active").innerText = active;
  document.getElementById("onRoute").innerText = onRoute;
  document.getElementById("inTerminal").innerText = inTerminal;
  document.getElementById("maintenance").innerText = maintenance;
}

/* =============================== ADD BUS =============================== */
async function addBus() {
  const bus = {
    bus_number: document.getElementById("bus_number").value,
    plate_number: document.getElementById("plate").value,
    route: document.getElementById("route").value,
    driver: document.getElementById("driver").value,
    conductor: document.getElementById("conductor").value,
    status: document.getElementById("status").value || "Active"
  };
  if (!bus.bus_number) { alert("Bus number is required"); return; }
  const res = await fetch(api + "/api/buses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bus)
  });
  const data = await res.json();
  if (data.error) { alert("Error: " + data.error); return; }
  clearBusForm();
  loadBuses();
}

/* =============================== EDIT BUS MODAL =============================== */
function editBus(id, bus_number, plate, route, driver, conductor, status) {
  document.getElementById("editBusId").value = id;
  document.getElementById("editBusNumber").value = bus_number;
  document.getElementById("editPlate").value = plate;
  document.getElementById("editRoute").value = route;
  document.getElementById("editDriver").value = driver;
  document.getElementById("editConductor").value = conductor;
  document.getElementById("editStatus").value = status;
  document.getElementById("editBusModal").style.display = "flex";
}

function closeBusModal() { document.getElementById("editBusModal").style.display = "none"; }

async function saveBusEdit() {
  const id = document.getElementById("editBusId").value;
  const updatedBus = {
    plate_number: document.getElementById("editPlate").value,
    route: document.getElementById("editRoute").value,
    driver: document.getElementById("editDriver").value,
    conductor: document.getElementById("editConductor").value,
    status: document.getElementById("editStatus").value
  };
  await fetch(api + "/api/buses/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedBus)
  });
  closeBusModal();
  loadBuses();
}

/* =============================== DELETE BUS =============================== */
async function deleteBus(id) {
  if (!confirm("Delete this bus?")) return;
  await fetch(api + "/api/buses/" + id, { method: "DELETE" });
  loadBuses();
}

/* =============================== CLEAR BUS FORM =============================== */
function clearBusForm() {
  document.getElementById("bus_number").value = "";
  document.getElementById("plate").value = "";
  document.getElementById("route").value = "";
  document.getElementById("driver").value = "";
  document.getElementById("conductor").value = "";
  document.getElementById("status").value = "Active";
}

/* =============================== LOAD LOGS =============================== */
async function loadLogs() {
  const res = await fetch(api + "/api/logs");
  const logs = await res.json();
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";

  logs.forEach(l => {
    tbody.innerHTML += `
      <tr>
        <td>${l.bus_number}</td>
        <td>${l.action}</td>
        <td>${l.time}</td>
        <td>${l.date}</td>
        <td>${l.remarks || ""}</td>
        <td>
          <button class="edit-btn" onclick="editLog(${l.id}, '${l.bus_number}', '${l.action}', '${l.remarks || ""}')">Edit</button>
          <button class="delete-btn" onclick="deleteLog(${l.id})">Delete</button>
        </td>
      </tr>`;
  });
}

/* =============================== ADD LOG =============================== */
async function addLog() {
  const log = {
    bus_number: document.getElementById("log_bus").value,
    action: document.getElementById("action").value,
    remarks: document.getElementById("remarks").value
  };
  if (!log.bus_number || !log.action) { alert("Bus number and action required"); return; }
  const res = await fetch(api + "/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log)
  });
  const data = await res.json();
  if (data.error) { alert("Error:" + data.error); return; }
  clearLogForm();
  loadLogs();
  loadBuses();
}

/* =============================== EDIT LOG MODAL =============================== */
function editLog(id, bus_number, action, remarks) {
  document.getElementById("editLogId").value = id;
  document.getElementById("editLogBus").value = bus_number;
  document.getElementById("editLogAction").value = action;
  document.getElementById("editLogRemarks").value = remarks;
  document.getElementById("editLogModal").style.display = "flex";
}

function closeLogModal() { document.getElementById("editLogModal").style.display = "none"; }

async function saveLogEdit() {
  const id = document.getElementById("editLogId").value;
  const updatedLog = {
    action: document.getElementById("editLogAction").value,
    remarks: document.getElementById("editLogRemarks").value
  };
  await fetch(api + "/api/logs/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedLog)
  });
  closeLogModal();
  loadLogs();
}

/* =============================== DELETE LOG =============================== */
async function deleteLog(id) {
  if (!confirm("Delete this log?")) return;
  await fetch(api + "/api/logs/" + id, { method: "DELETE" });
  loadLogs();
  loadBuses();
}

/* =============================== CLEAR LOG FORM =============================== */
function clearLogForm() {
  document.getElementById("log_bus").value = "";
  document.getElementById("action").value = "IN";
  document.getElementById("remarks").value = "";
}

/* =============================== SEARCH BUS =============================== */
function searchBus() {
  const input = document.getElementById("searchBus").value.toLowerCase();
  document.querySelectorAll("#busTable tbody tr").forEach(row => {
    row.style.display = row.children[0].innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

/* =============================== PRINT FUNCTIONS =============================== */
function printBuses() {
  const table = document.getElementById("busTable").outerHTML;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Bus List</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Bus List</h2>
        ${table}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function printLogs() {
  const table = document.getElementById("logTable").outerHTML;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Bus Logs</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Bus Logs</h2>
        ${table}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

/* =============================== INITIAL LOAD =============================== */
loadBuses();
loadLogs();