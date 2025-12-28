// app.js
const express = require("express");
const app = express();
app.use(express.json());

// Hardcoded user
const user = { username: "admin", password: "1234", balance: 500 };

// Exchange rates
const exchangeRates = { USD: 1, NGN: 460, EUR: 0.91, GBP: 0.82 };

// Serve frontend HTML + JS + CSS
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Bank App</title>
<style>
:root {
  --primary-color: #007bff;
  --bg-light: #f0f2f5;
  --bg-dark: #1e1e2f;
  --card-light: #fff;
  --card-dark: #2c2c3d;
  --text-light: #000;
  --text-dark: #fff;
}
body { margin:0; font-family:Arial; display:flex; height:100vh; background:var(--bg-light); color:var(--text-light); transition: all 0.3s; }
#sidebar { width:200px; background:var(--primary-color); color:#fff; padding:20px; display:flex; flex-direction:column; transform:translateX(-220px); transition: transform 0.5s; }
#sidebar.active { transform:translateX(0); }
.sidebar-item { padding:12px; margin:5px 0; border-radius:8px; cursor:pointer; transition:0.3s; }
.sidebar-item:hover { background:#0056b3; }
#main { flex:1; padding:30px; transition: margin-left 0.5s; margin-left:0; overflow-y:auto; }
#main.shift { margin-left:200px; }
.container { background:var(--card-light); border-radius:15px; padding:20px; box-shadow:0 8px 20px rgba(0,0,0,0.2); margin-bottom:20px; opacity:0; transform:translateY(20px); animation:fadeInUp 0.8s forwards; transition: all 0.3s; }
input, select, button { width:100%; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #ccc; }
button { cursor:pointer; background:var(--primary-color); color:#fff; border:none; transition:0.3s; }
button:hover { transform:scale(1.05); }
table { width:100%; border-collapse:collapse; margin-top:10px; }
th, td { border:1px solid #ccc; padding:8px; text-align:left; transition: all 0.3s; }
tr:hover { background: rgba(0,123,255,0.1); }
.balance { padding:10px; background:#f8f9fa; border-radius:8px; transition: all 0.5s; margin-top:10px; }
canvas { margin-top:20px; transition: all 0.5s; }
.dark-mode { background:var(--bg-dark); color:var(--text-dark); }
.dark-mode .container { background:var(--card-dark); }
.dark-mode .balance { background:#3c3c4d; }
@keyframes fadeInUp { to { opacity:1; transform:translateY(0); } }
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<div id="sidebar">
  <h2>Bank Menu</h2>
  <div class="sidebar-item" onclick="showPage('Dashboard')">Dashboard</div>
  <div class="sidebar-item" onclick="showPage('Transactions')">Transactions</div>
  <div class="sidebar-item" onclick="toggleDarkMode()">Toggle Dark Mode</div>
  <div class="sidebar-item" onclick="logout()">Logout</div>
</div>

<div id="main">
  <div class="container" id="loginContainer">
    <h2>Bank Login</h2>
    <input type="text" id="username" placeholder="Username">
    <input type="password" id="password" placeholder="Password">
    <button id="loginBtn">Login</button>
    <p id="message" style="color:red;"></p>
  </div>

  <div class="container" id="dashboardContainer" style="display:none;">
    <h2>Welcome <span id="user"></span></h2>
    <label>Select Currency:</label>
    <select id="currency">
      <option value="USD">USD</option>
      <option value="NGN">NGN</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
    <div class="balance" id="balanceDisplay"></div>
    <canvas id="transactionChart" width="400" height="200"></canvas>
  </div>

  <div class="container" id="transactionsContainer" style="display:none;">
    <h3>Recent Transactions</h3>
    <table>
      <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody id="transactions"></tbody>
    </table>
  </div>
</div>

<script>
const loginContainer = document.getElementById("loginContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const transactionsContainer = document.getElementById("transactionsContainer");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const userSpan = document.getElementById("user");
const currencySelect = document.getElementById("currency");
const balanceDisplay = document.getElementById("balanceDisplay");
const transactionsBody = document.getElementById("transactions");
const sidebar = document.getElementById("sidebar");
const main = document.getElementById("main");
const chartCanvas = document.getElementById("transactionChart");
let darkMode = false;

let currentUser = null;
let transactionChart = null;
const transactionsData = [
  { date:"2025-12-25", description:"Deposit", amount:200 },
  { date:"2025-12-26", description:"Withdrawal", amount:-50 },
  { date:"2025-12-27", description:"Deposit", amount:100 }
];

loginBtn.onclick = () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  fetch("/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password}) })
  .then(r=>r.json())
  .then(data=>{
    if(data.success){
      currentUser=username;
      loginContainer.style.display="none";
      dashboardContainer.style.display="block";
      sidebar.classList.add("active");
      main.classList.add("shift");
      userSpan.textContent=username;
      showPage('Dashboard');
    } else message.textContent=data.message;
  });
};

function logout(){
  currentUser=null;
  loginContainer.style.display="block";
  dashboardContainer.style.display="none";
  transactionsContainer.style.display="none";
  sidebar.classList.remove("active");
  main.classList.remove("shift");
  usernameInput.value=""; passwordInput.value=""; message.textContent="";
}

function toggleDarkMode(){
  darkMode = !darkMode;
  if(darkMode) document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");
}

currencySelect.onchange = () => { updateBalance(); showChart(); }

function showPage(page){
  dashboardContainer.style.display = page==='Dashboard'? 'block':'none';
  transactionsContainer.style.display = page==='Transactions'? 'block':'none';
  if(page==='Dashboard') { updateBalance(); showChart(); }
  if(page==='Transactions') displayTransactions();
}

function updateBalance(){
  const currency = currencySelect.value;
  fetch(\`/balance?username=\${currentUser}&currency=\${currency}\`)
  .then(r=>r.json())
  .then(data=>{
    balanceDisplay.innerHTML = '<strong>Balance:</strong> '+data.balance+' '+data.currency+'<br><small>(Base: USD)</small>';
  });
}

function displayTransactions(){
  const currency = currencySelect.value;
  fetch(\`/balance?username=\${currentUser}&currency=\${currency}\`)
  .then(r=>r.json())
  .then(data=>{
    const rate = data.balance/data.base;
    transactionsBody.innerHTML="";
    transactionsData.forEach((tx,i)=>{
      const row=document.createElement("tr");
      row.style.opacity=0; row.style.transform="translateX(-20px)";
      row.innerHTML=\`<td>\${tx.date}</td><td>\${tx.description}</td><td>\${(tx.amount*rate).toFixed(2)} \${currency}</td>\`;
      transactionsBody.appendChild(row);
      setTimeout(()=>{ row.style.transition="all 0.3s"; row.style.opacity=1; row.style.transform="translateX(0)"; }, i*200);
    });
  });
}

// Chart.js animation
function showChart(){
  const currency = currencySelect.value;
  fetch(\`/balance?username=\${currentUser}&currency=\${currency}\`)
  .then(r=>r.json())
  .then(data=>{
    const rate = data.balance/data.base;
    const labels = transactionsData.map(tx=>tx.date);
    const amounts = transactionsData.map(tx=>(tx.amount*rate).toFixed(2));
    if(transactionChart) transactionChart.destroy();
    transactionChart = new Chart(chartCanvas, {
      type:'bar',
      data:{
        labels:labels,
        datasets:[{
          label:'Transactions ('+currency+')',
          data:amounts,
          backgroundColor: 'rgba(0,123,255,0.6)',
          borderColor: 'rgba(0,123,255,1)',
          borderWidth:1,
          hoverBackgroundColor:'rgba(255,193,7,0.7)'
        }]
      },
      options:{ responsive:true, animation:{ duration:800 }, scales:{ y:{ beginAtZero:true } } }
    });
  });
}
</script>

</body>
</html>
  `);
});

// Login API
app.post("/login",(req,res)=>{
  const { username,password } = req.body;
  if(username===user.username && password===user.password) return res.json({ success:true });
  res.json({ success:false, message:"Invalid credentials" });
});

// Balance API
app.get("/balance",(req,res)=>{
  const { username,currency }=req.query;
  if(username!==user.username) return res.status(404).json({ message:"User not found" });
  const rate = exchangeRates[currency.toUpperCase()]||1;
  res.json({ balance:(user.balance*rate).toFixed(2), currency:currency.toUpperCase(), base:1, baseCurrency:"USD" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(\`Bank app running at http://localhost:\${PORT}\`));
