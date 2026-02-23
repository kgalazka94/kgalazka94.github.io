let QUESTIONS = [];
let currentSet = [];
let currentIndex = 0;
let nick = "";
let progress = {};
let examAnswers = {};
let timer;
let timeLeft = 0;
let mode = ""; // learn / exam

// ================= INIT =================

async function init() {
nick = document.getElementById("nick").value;
if (!nick) return alert("Podaj nick");

await loadQuestions();
loadProgress();

document.getElementById("startScreen").classList.add("hidden");
document.getElementById("menu").classList.remove("hidden");
document.getElementById("userBox").innerText = "👤 " + nick;
}

async function loadQuestions() {
const res = await fetch("questions.json");
QUESTIONS = await res.json();
}

function loadProgress() {
progress = JSON.parse(localStorage.getItem("sternik_progress_" + nick)) || {};
}

function saveProgress() {
localStorage.setItem("sternik_progress_" + nick, JSON.stringify(progress));
}

// ================= TRYB NAUKI =================

function startLearning() {
mode = "learn";
currentSet = QUESTIONS;
currentIndex = 0;
examAnswers = {};
startMode();
}

// ================= TRYB EGZAMINU =================

function startExam() {
mode = "exam";
currentSet = shuffle([...QUESTIONS]).slice(0,75);
currentIndex = 0;
examAnswers = {};
timeLeft = 90*60;
startTimer();
startMode();
}

// ================= WSPÓLNE =================

function startMode() {
document.getElementById("menu").classList.add("hidden");
document.getElementById("examLayout").classList.remove("hidden");
buildSidebar();
showQuestion();
}

function buildSidebar() {
let nav = "";

currentSet.forEach((q,i)=>{
let statusClass = "unanswered";
let percent = getMasteryPercent(q.id);

if(progress[q.id]) {
if(progress[q.id].lastCorrect === true) statusClass = "correct";
if(progress[q.id].lastCorrect === false) statusClass = "wrong";
}

nav += `
<div id="nav${i}" 
class="${statusClass}" 
onclick="goTo(${i})">
${i+1} <small>${percent}%</small>
</div>`;
});

document.getElementById("questionNav").innerHTML = nav;
}

function getMasteryPercent(id) {
if(!progress[id]) return 0;
let total = progress[id].correct + progress[id].wrong;
if(total === 0) return 0;
return Math.round((progress[id].correct / total) * 100);
}

function showQuestion() {
const q = currentSet[currentIndex];

document.querySelectorAll(".sidebar div").forEach(e=>e.classList.remove("active"));
if(document.getElementById("nav"+currentIndex))
document.getElementById("nav"+currentIndex).classList.add("active");

let html = `<h3>Pytanie ${currentIndex+1}</h3><p>${q.question}</p>`;

q.options.forEach((opt,i)=>{
let checked = examAnswers[q.id]===i ? "checked":"";
let disabled = mode==="learn" && progress[q.id]?.answered ? "disabled":"";

html += `
<div>
<input type="radio" name="ans" value="${i}" ${checked} ${disabled}
onclick="handleAnswer(${i})"> ${opt}
</div>`;
});

html += `<div id="feedback" style="margin-top:15px;"></div>`;

if(mode==="learn" && progress[q.id]?.answered) {
showLearningFeedback(q);
}

document.getElementById("content").innerHTML = html;
updateProgressBar();
}

function handleAnswer(selectedIndex) {
const q = currentSet[currentIndex];

if(mode === "exam") {
examAnswers[q.id] = selectedIndex;
updateProgressBar();
return;
}

// TRYB NAUKI
if (!progress[q.id]) progress[q.id] = { correct: 0, wrong: 0 };

progress[q.id].answered = true;

const allInputs = document.querySelectorAll('input[name="ans"]');
allInputs.forEach(input => input.disabled = true);

if (selectedIndex === q.answer) {
progress[q.id].correct++;
progress[q.id].lastCorrect = true;
} else {
progress[q.id].wrong++;
progress[q.id].lastCorrect = false;
}

saveProgress();
buildSidebar();
showLearningFeedback(q, selectedIndex);
}

function showLearningFeedback(q, selectedIndex=null) {
let feedback = document.getElementById("feedback");

let isCorrect = progress[q.id].lastCorrect;

if (isCorrect) {
feedback.innerHTML = `<p style="color:green;font-weight:bold;">✅ Poprawna odpowiedź!</p>`;
} else {
feedback.innerHTML = `
<p style="color:red;font-weight:bold;">❌ Błędna odpowiedź</p>
<p>Poprawna odpowiedź: <strong>${q.options[q.answer]}</strong></p>
`;
}

feedback.innerHTML += `<button onclick="nextLearningQuestion()">Dalej →</button>`;
}

function nextLearningQuestion() {
currentIndex++;
if (currentIndex >= currentSet.length) {
document.getElementById("content").innerHTML =
"<h2>Koniec trybu nauki 🎉</h2>";
return;
}
showQuestion();
}

// ================= NAWIGACJA =================

function nextQuestion() {
if(currentIndex<currentSet.length-1) currentIndex++;
showQuestion();
}

function prevQuestion() {
if(currentIndex>0) currentIndex--;
showQuestion();
}

function goTo(i) {
currentIndex = i;
showQuestion();
}

// ================= TIMER =================

function startTimer() {
timer = setInterval(()=>{
timeLeft--;
let m=Math.floor(timeLeft/60);
let s=timeLeft%60;
document.getElementById("timer").innerText=`⏳ ${m}:${s<10?"0":""}${s}`;
if(timeLeft<=0) finishExam();
},1000);
}

// ================= ZAKOŃCZENIE EGZAMINU =================

function finishExam() {
clearInterval(timer);

let correct = 0;

currentSet.forEach(q=>{
if(examAnswers[q.id] === q.answer) {
correct++;
if(!progress[q.id]) progress[q.id]={correct:0,wrong:0};
progress[q.id].correct++;
progress[q.id].lastCorrect = true;
} else {
if(!progress[q.id]) progress[q.id]={correct:0,wrong:0};
progress[q.id].wrong++;
progress[q.id].lastCorrect = false;
}
});

saveProgress();

let percent = Math.round((correct/currentSet.length)*100);

alert("Wynik: "+percent+"%");

location.reload();
}

// ================= PROGRESS BAR =================

function updateProgressBar() {
if(mode !== "exam") return;

let answered = Object.keys(examAnswers).length;
let percent = (answered/currentSet.length)*100;
document.getElementById("progressFill").style.width = percent+"%";
}

// ================= UTILS =================

function shuffle(arr){
return arr.sort(()=>Math.random()-0.5);
}
