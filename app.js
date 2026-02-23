
let QUESTIONS = [];
let currentSet = [];
let currentIndex = 0;
let nick = "";
let progress = {};
let examAnswers = {};
let timer;
let timeLeft = 0;

// ===== INIT =====

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

// ===== TRYB NAUKI =====

function startLearning() {
currentSet = QUESTIONS;
startMode(false);
}

// ===== TRYB EGZAMIN =====

function startExam() {
currentSet = shuffle([...QUESTIONS]).slice(0,75);
examAnswers = {};
timeLeft = 90*60;
startTimer();
startMode(true);
}

function startMode(isExam) {
document.getElementById("menu").classList.add("hidden");
document.getElementById("examLayout").classList.remove("hidden");
currentIndex = 0;
buildSidebar();
showQuestion();
}

// ===== WYŚWIETLANIE =====

function buildSidebar() {
let nav = "";
currentSet.forEach((q,i)=>{
nav += `<div id="nav${i}" onclick="goTo(${i})">${i+1}</div>`;
});
document.getElementById("questionNav").innerHTML = nav;
}

function showQuestion() {
const q = currentSet[currentIndex];
document.querySelectorAll(".sidebar div").forEach(e=>e.classList.remove("active"));
document.getElementById("nav"+currentIndex).classList.add("active");

let html = `<h3>Pytanie ${currentIndex+1}</h3><p>${q.question}</p>`;

q.options.forEach((opt,i)=>{
let checked = examAnswers[q.id]===i ? "checked":"";
html += `<div>
<input type="radio" name="ans" value="${i}" ${checked}
onchange="saveAnswer(${i})"> ${opt}
</div>`;
});

document.getElementById("content").innerHTML = html;
updateProgressBar();
}

function saveAnswer(i) {
examAnswers[currentSet[currentIndex].id] = i;
}

// ===== NAWIGACJA =====

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

// ===== TIMER =====

function startTimer() {
timer = setInterval(()=>{
timeLeft--;
let m=Math.floor(timeLeft/60);
let s=timeLeft%60;
document.getElementById("timer").innerText=`⏳ ${m}:${s<10?"0":""}${s}`;
if(timeLeft<=0) finishExam();
},1000);
}

// ===== ZAKOŃCZENIE =====

function finishExam() {
clearInterval(timer);
let correct = 0;

currentSet.forEach(q=>{
if(examAnswers[q.id]===q.answer) {
correct++;
if(!progress[q.id]) progress[q.id]={correct:0,wrong:0};
progress[q.id].correct++;
} else {
if(!progress[q.id]) progress[q.id]={correct:0,wrong:0};
progress[q.id].wrong++;
}
});

saveProgress();

let percent = Math.round((correct/currentSet.length)*100);
alert("Wynik: "+percent+"%");
location.reload();
}

// ===== PROGRESS BAR =====

function updateProgressBar() {
let answered = Object.keys(examAnswers).length;
let percent = (answered/currentSet.length)*100;
document.getElementById("progressFill").style.width = percent+"%";
}

function shuffle(arr){
return arr.sort(()=>Math.random()-0.5);
}
