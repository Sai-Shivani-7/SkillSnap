document.addEventListener("DOMContentLoaded", () => {
    
    // --- STATE ---
    let currentState = {
        time: 5,
        topic: "",
        language: "English",
        lessonText: "",
        quizData: [],
        chartInstance: null
    };

    // --- DOM Elements ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view-section');
    
    const timeBtns = document.querySelectorAll('.time-btn');
    const topicInput = document.getElementById('topic-input');
    const languageSelect = document.getElementById('language-select');
    const generateBtn = document.getElementById('generate-btn');

    // --- Navigation Logic ---
    function switchView(viewId) {
        views.forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        
        if(viewId === 'dashboard-view') {
            loadDashboard();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            switchView(link.dataset.view);
        });
    });

    // --- Home View Setup ---
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentState.time = parseInt(btn.dataset.time);
        });
    });

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert("Please enter a topic to learn!");
            return;
        }
        
        currentState.topic = topic;
        currentState.language = languageSelect.value;
        
        switchView('loading-view');
        
        try {
            const resp = await fetch('http://localhost:5000/api/generate-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: currentState.topic,
                    duration: currentState.time,
                    language: currentState.language
                })
            });
            const data = await resp.json();
            
            if (data.error) {
                alert("Error: " + data.error);
                switchView('home-view');
                return;
            }
            
            document.getElementById('lesson-title').innerText = data.topic;
            document.getElementById('lesson-body').innerHTML = data.lesson;
            currentState.lessonText = document.getElementById('lesson-body').innerText; // Strip HTML for TTS and Quiz
            
            // clear doubts
            document.getElementById('doubt-input').value = '';
            document.getElementById('doubt-answer').classList.add('hidden');
            
            switchView('learning-view');
            
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server.");
            switchView('home-view');
        }
    });

    // --- Learning View Interactions ---
    document.querySelector('.back-btn').addEventListener('click', () => {
        speechSynthesis.cancel(); // Stop speaking if going back
        navLinks[0].click(); // Go home
    });

    // Text to Speech
    const ttsBtn = document.getElementById('tts-btn');
    ttsBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            ttsBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(currentState.lessonText);
        // Try to match language basic
        if (currentState.language === "Spanish") utterance.lang = 'es-ES';
        if (currentState.language === "Hindi") utterance.lang = 'hi-IN';
        if (currentState.language === "Telugu") utterance.lang = 'te-IN'; // Limited support depending on OS
        
        ttsBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
        
        utterance.onend = () => {
            ttsBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
        };
        
        speechSynthesis.speak(utterance);
    });

    // Ask Doubt
    document.getElementById('submit-doubt-btn').addEventListener('click', submitDoubt);
    document.getElementById('doubt-input').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') submitDoubt();
    });

    async function submitDoubt() {
        const doubt = document.getElementById('doubt-input').value.trim();
        if(!doubt) return;
        
        const answerDiv = document.getElementById('doubt-answer');
        answerDiv.classList.remove('hidden');
        answerDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
        
        try {
            const resp = await fetch('http://localhost:5000/api/clarify-doubt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doubt, topic: currentState.topic })
            });
            const data = await resp.json();
            answerDiv.innerHTML = data.explanation || data.error;
        } catch (e) {
            answerDiv.innerHTML = "Failed to fetch explanation.";
        }
    }

    // Voice Input for Doubt (Web Speech API)
    const micBtn = document.getElementById('mic-btn');
    const doubtInput = document.getElementById('doubt-input');
    
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Match language to selected learning language
        recognition.lang = 'en-US'; 
        
        micBtn.addEventListener('mousedown', () => {
            if(currentState.language === "Spanish") recognition.lang = 'es-ES';
            if(currentState.language === "Hindi") recognition.lang = 'hi-IN';
            if(currentState.language === "Telugu") recognition.lang = 'te-IN';
            
            try {
                recognition.start();
                micBtn.classList.add('recording');
            } catch(e) {}
        });
        
        micBtn.addEventListener('mouseup', () => {
            recognition.stop();
            micBtn.classList.remove('recording');
        });
        // Mobile support
        micBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            recognition.start();
            micBtn.classList.add('recording');
        });
        micBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            recognition.stop();
            micBtn.classList.remove('recording');
        });
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            doubtInput.value = transcript;
            // Optionally auto-submit: submitDoubt();
        };
    } else {
        micBtn.style.display = 'none'; // hide if not supported
    }

    // --- Quiz Flow ---
    document.getElementById('take-quiz-btn').addEventListener('click', async () => {
        speechSynthesis.cancel();
        switchView('quiz-loading-view');
        
        try {
            const resp = await fetch('http://localhost:5000/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentState.lessonText })
            });
            const data = await resp.json();
            
            if (data.error) {
                alert("Error: " + data.error);
                switchView('learning-view');
                return;
            }
            
            currentState.quizData = data.questions || [];
            renderQuiz();
            switchView('quiz-view');
            
        } catch (e) {
            console.error(e);
            alert("Failed to generate quiz.");
            switchView('learning-view');
        }
    });

    function renderQuiz() {
        const container = document.getElementById('quiz-container');
        container.innerHTML = '';
        
        currentState.quizData.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'quiz-question';
            
            let optionsHtml = '';
            q.options.forEach((opt, optIndex) => {
                optionsHtml += `
                    <label class="option-label">
                        <input type="radio" name="q${index}" value="${opt}">
                        ${opt}
                    </label>
                `;
            });
            
            qDiv.innerHTML = `
                <h4>${index + 1}. ${q.question}</h4>
                <div class="options-group">
                    ${optionsHtml}
                </div>
            `;
            container.appendChild(qDiv);
        });
    }

    document.getElementById('submit-quiz-btn').addEventListener('click', async () => {
        // Evaluate answers
        let results = [];
        let allAnswered = true;
        
        currentState.quizData.forEach((q, index) => {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            if (!selected) {
                allAnswered = false;
            } else {
                results.push({
                    question: q.question,
                    is_correct: selected.value === q.correct_answer,
                    selected: selected.value,
                    correct: q.correct_answer
                });
            }
        });
        
        if (!allAnswered) {
            alert("Please answer all questions before submitting.");
            return;
        }
        
        // Show loading state temporarily
        const btn = document.getElementById('submit-quiz-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Grading...';
        btn.disabled = true;
        
        try {
            const resp = await fetch('http://localhost:5000/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results, topic: currentState.topic })
            });
            const data = await resp.json();
            
            // Set Result view
            document.getElementById('score-text').innerText = `${data.score}/${data.max_score}`;
            document.getElementById('feedback-text').innerText = data.feedback;
            
            const simpArea = document.getElementById('simplification-area');
            if (data.requires_simplification) {
                simpArea.classList.remove('hidden');
                document.getElementById('simplification-text').innerText = "Looks like some concepts missed the mark. Next time we encounter this topic, we will use simpler analogies.";
            } else {
                simpArea.classList.add('hidden');
            }
            
            switchView('result-view');
            
        } catch (e) {
            console.error(e);
            alert("Failed to submit quiz.");
        } finally {
            btn.innerHTML = 'Submit Answers';
            btn.disabled = false;
        }
    });

    document.querySelector('.nav-to-dashboard').addEventListener('click', () => {
        navLinks[1].click(); // Click dashboard link
    });

    // --- Dashboard Logic ---
    async function loadDashboard() {
        try {
            const resp = await fetch('http://localhost:5000/api/dashboard');
            const data = await resp.json();
            
            document.getElementById('total-time').innerText = data.total_time_mins;
            document.getElementById('avg-accuracy').innerText = `${data.avg_accuracy}%`;
            document.getElementById('streak-days').innerText = data.streak_days;
            
            // Populate Lists
            const recentList = document.getElementById('recent-topics-list');
            recentList.innerHTML = data.recent_topics.map(t => `<li>${t}</li>`).join('') || "<li>No topics learned yet.</li>";
            
            const weakList = document.getElementById('weak-topics-list');
            weakList.innerHTML = data.weak_topics.map(t => `<li>${t}</li>`).join('') || "<li>You're doing great! No specific weak areas found.</li>";
            
            // Render Chart
            renderChart(data.chart_data);
            
        } catch (e) {
            console.error("Dashboard error:", e);
        }
    }

    function renderChart(chartData) {
        if (!chartData || chartData.length === 0) return;
        
        const ctx = document.getElementById('accuracyChart').getContext('2d');
        
        // Destroy old instance if exists
        if (currentState.chartInstance) {
            currentState.chartInstance.destroy();
        }
        
        const labels = chartData.map(d => d.topic);
        const dataPoints = chartData.map(d => d.accuracy);
        
        currentState.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quiz Accuracy (%)',
                    data: dataPoints,
                    borderColor: '#6d28d9',
                    backgroundColor: 'rgba(109, 40, 217, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#a0a0ab' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#a0a0ab' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

});
