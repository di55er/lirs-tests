const $ = (id) => document.getElementById(id);

let quizzes = [];
let current = { quiz: null, question: 0, scoreA: 0, scoreB: 0 };

// ── Initialize ──
async function init() {
    try {
        const res = await fetch('data/quizzes.json');
        quizzes = await res.json();
        renderHome();
    } catch (e) {
        $('app').innerHTML = '<p style="text-align:center;padding:3rem;font-size:1.2rem">שגיאה בטעינת החידונים 😕</p>';
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Home Screen ──
function renderHome() {
    $('quiz-grid').innerHTML = quizzes.map(q => `
        <div class="quiz-card"
             style="--stripe: linear-gradient(90deg, ${q.optionA.color}, ${q.optionB.color})"
             onclick="startQuiz('${q.id}')">
            <span class="emojis">${q.optionA.emoji} ${q.optionB.emoji}</span>
            <h3>${q.title}</h3>
            <p>${q.description}</p>
        </div>
    `).join('');
    showScreen('home');
}

// ── Quiz Screen ──
function startQuiz(id) {
    current.quiz = quizzes.find(q => q.id === id);
    current.question = 0;
    current.scoreA = 0;
    current.scoreB = 0;
    showScreen('quiz');
    renderQuestion();
}

function renderQuestion() {
    const { quiz, question } = current;
    const q = quiz.questions[question];
    const total = quiz.questions.length;

    $('quiz-title').textContent = quiz.title;
    $('question-counter').textContent = `${question + 1} / ${total}`;
    $('progress-bar').style.width = `${(question / total) * 100}%`;

    const el = $('choices');
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';

    setTimeout(() => {
        el.innerHTML = `
            <div class="choice-card" style="background: ${quiz.optionA.gradient}" onclick="choose('a')">
                <span class="emoji">${q.a.emoji}</span>
                <span class="label">${q.a.label}</span>
            </div>
            <div class="choice-card" style="background: ${quiz.optionB.gradient}" onclick="choose('b')">
                <span class="emoji">${q.b.emoji}</span>
                <span class="label">${q.b.label}</span>
            </div>
        `;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 200);
}

function choose(option) {
    if (option === 'a') current.scoreA++;
    else current.scoreB++;
    current.question++;

    if (current.question >= current.quiz.questions.length) {
        $('progress-bar').style.width = '100%';
        setTimeout(showResult, 300);
    } else {
        renderQuestion();
    }
}

// ── Result Screen ──
function showResult() {
    const { quiz, scoreA, scoreB } = current;
    const total = quiz.questions.length;
    const pctA = Math.round((scoreA / total) * 100);
    const pctB = 100 - pctA;
    const winner = scoreA >= scoreB ? quiz.optionA : quiz.optionB;

    if (scoreA === scoreB) {
        $('result-emoji').textContent = '⚖️';
        $('result-title').textContent = `שניהם! ${quiz.optionA.emoji}${quiz.optionB.emoji}`;
        $('result-desc').textContent = `אתם בדיוק באמצע! יש בכם את שני הצדדים בצורה שווה – גם ${quiz.optionA.name} וגם ${quiz.optionB.name}.`;
    } else {
        $('result-emoji').textContent = winner.emoji;
        $('result-title').textContent = `אתם ${winner.name}!`;
        $('result-desc').textContent = winner.description;
    }

    // Score bar
    const labelA = pctA >= 20 ? `${pctA}% ${quiz.optionA.emoji}` : quiz.optionA.emoji;
    const labelB = pctB >= 20 ? `${pctB}% ${quiz.optionB.emoji}` : quiz.optionB.emoji;

    $('result-bar').innerHTML = `
        <div class="bar-segment" style="width:0%; background:${quiz.optionA.gradient}">${labelA}</div>
        <div class="bar-segment" style="width:0%; background:${quiz.optionB.gradient}">${labelB}</div>
    `;

    showScreen('result');

    // Animate bar after a brief delay
    setTimeout(() => {
        const segs = $('result-bar').querySelectorAll('.bar-segment');
        segs[0].style.width = pctA + '%';
        segs[1].style.width = pctB + '%';
    }, 200);

    spawnConfetti();
}

// ── Confetti ──
function spawnConfetti() {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    const colors = ['#667eea', '#764ba2', '#FF6B35', '#4CAF50', '#E91E63', '#FFB347', '#00BCD4', '#FF4081'];

    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.width = (6 + Math.random() * 8) + 'px';
        c.style.height = (6 + Math.random() * 8) + 'px';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.setProperty('--delay', (Math.random() * 1.5) + 's');
        c.style.setProperty('--duration', (2 + Math.random() * 2) + 's');
        c.style.setProperty('--drift', (Math.random() * 150 - 75) + 'px');
        c.style.setProperty('--spin', (Math.random() * 720) + 'deg');
        document.body.appendChild(c);
    }

    setTimeout(() => document.querySelectorAll('.confetti').forEach(c => c.remove()), 5000);
}

// ── Actions ──
function retryQuiz() {
    startQuiz(current.quiz.id);
}

function goHome() {
    renderHome();
}

function shareResult() {
    const { quiz, scoreA, scoreB } = current;
    const winner = scoreA >= scoreB ? quiz.optionA : quiz.optionB;
    const total = quiz.questions.length;
    const pct = Math.round((Math.max(scoreA, scoreB) / total) * 100);

    const text = scoreA === scoreB
        ? `עשיתי את החידון "${quiz.title}" ויצא לי שניהם! ⚖️\nנסו גם אתם!`
        : `עשיתי את החידון "${quiz.title}" ויצא לי ${winner.name}! ${winner.emoji} (${pct}%)\nנסו גם אתם!`;

    if (navigator.share) {
        navigator.share({ text }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.btn-share');
            const orig = btn.textContent;
            btn.textContent = '✅ הועתק!';
            setTimeout(() => btn.textContent = orig, 2000);
        });
    }
}

// 🚀 Start!
init();
