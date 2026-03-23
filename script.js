const canvas = document.getElementById("scratch");
const ctx = canvas.getContext("2d");
const instruction = document.getElementById("instruction");
const container = document.querySelector(".heart-wrapper");

// Zabr�n�n� necht�n�mu chov�n� v prohl�e�i
canvas.addEventListener('dragstart', (e) => e.preventDefault());
canvas.addEventListener('selectstart', (e) => e.preventDefault());

let scratching = false;

// 1. Deklarujeme obr�zek jen JEDNOU
const heartImg = new Image();
heartImg.src = "heart.png";

// 2. Po�k�me na na�ten� obr�zku a pak spust�me v�e ostatn�
heartImg.onload = () => {
    initCanvas();
};

// Pokud by se obr�zek nena�etl (chyba v cest�), spust�me to aspo� se zlatou barvou
heartImg.onerror = () => {
    console.error("Obr�zek heart.png nebyl nalezen!");
    initCanvas();
};

function initCanvas() {
    const dpr = window.devicePixelRatio || 2;
    const w = container.offsetWidth || 300;
    const h = container.offsetHeight || 300;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.scale(dpr, dpr);

    // 1. OKAMŽITĚ vyplníme srdce zlatou barvou
    ctx.fillStyle = "#b8860b";
    ctx.fillRect(0, 0, w, h);

    // 2. Vykreslíme obrázek srdce (ten, co se maže)
    if (heartImg.complete && heartImg.naturalWidth !== 0) {
        ctx.drawImage(heartImg, 0, 0, w, h);
    }

    // 3. ZOBRAZÍME PODKLAD (lístky)
    const bg = document.getElementById('heart-background');
    if (bg) {
        bg.style.opacity = "1";
        bg.style.visibility = "visible";
    }

    // 4. ZOBRAZÍME TEXT POZVÁNKY
    const invite = document.querySelector('.invite-container');
    if (invite) {
        invite.classList.remove('hidden-at-start');
        invite.style.display = 'flex';
        invite.style.opacity = '1';
    }

    // 5. ZOBRAZÍME CELÝ OBAL
    container.classList.add('ready');
}

// Ud�losti pro st�r�n�
["mousedown", "touchstart"].forEach(evt =>
    canvas.addEventListener(evt, (e) => {
        scratching = true;
        scratch(e);
    }, { passive: false })
);

["mouseup", "touchend"].forEach(evt =>
    canvas.addEventListener(evt, () => scratching = false)
);

["mousemove", "touchmove"].forEach(evt =>
    canvas.addEventListener(evt, scratch, { passive: false })
);

function scratch(e) {
    if (!scratching) return;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();

    checkReveal();
}

function checkReveal() {
    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let cleared = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) cleared++;
        }

        const percentage = (cleared / (pixels.length / 4)) * 100;

        if (percentage > 20) {
            revealEverything();
        }
    } catch (e) {
        if (!window.backupTimer) {
            window.backupTimer = setTimeout(revealEverything, 2500);
        }
    }
}

function revealEverything() {
    createConfetti();

    if (instruction) {
        instruction.style.transition = "opacity 1s ease";
        instruction.style.opacity = "0";
        setTimeout(() => { instruction.style.visibility = "hidden"; }, 1000);
    }

    canvas.style.transition = "opacity 1s ease";
    canvas.style.opacity = "0";

    setTimeout(() => {
        canvas.style.display = "none";

        // POJISTKA PRO TLA��TKO: 
        // Zobraz�me ho a� ve chv�li, kdy srdce zmiz�, aby se nekrylo s canvasem
        const calWrapper = document.getElementById("calendar-wrapper");
        if (calWrapper) {
            calWrapper.classList.add("visible");
            console.log("Tlačítko aktivováno"); // Tohle uvid� v konzoli prohl�e�e
        }
    }, 1000);
}

function createConfetti() {
    const confContainer = document.getElementById("confetti-container");
    const colors = ["#ffffff", "#fce4ec", "#f06292", "#ffffff", "#fce4ec"];
    const shapes = ["circle", "square", "diamond"]; // Definujeme tvary

    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        confetti.style.left = "50vw";
        confetti.style.top = "50vh";

        // N�hodn� v�b�r barvy a tvaru
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        confetti.style.backgroundColor = color;

        // Nastaven� rozm�r�
        const size = Math.random() * 8 + 8 + "px";
        confetti.style.width = size;
        confetti.style.height = size;

        // Logika pro tvary
        if (shape === "circle") {
            confetti.style.borderRadius = "60%";
        } else if (shape === "diamond") {
            confetti.style.transform = "rotate(45deg)";
            // Aby se rotace z transformace netloukla s animac�, 
            // nastav�me ji rad�ji p��mo v kl��ov�ch sn�mc�ch n�e
        }
        // Square (�tvere�ek) nepot�ebuje extra styl, je to default

        confContainer.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 600 + 200;
        const destX = Math.cos(angle) * velocity;
        const destY = Math.sin(angle) * velocity;

        // N�hodn� rotace pro efekt "m�h�n�" ve vzduchu
        const randomRotation = Math.random() * 1080 - 540;

        confetti.animate([
            {
                transform: `translate(-50%, -50%) scale(0) rotate(0deg)`,
                opacity: 1
            },
            {
                transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY + 250}px)) scale(1) rotate(${randomRotation}deg)`,
                opacity: 0
            }
        ], {
            duration: Math.random() * 3000 + 5000, // Trv�n� 5-8 sekund
            easing: "cubic-bezier(0.1, 0.5, 0.2, 1)",
            fill: "forwards"
        }).onfinish = () => confetti.remove();
    }
}

function addSparklesToText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    setInterval(() => {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";

        // N�hodn� pozice v r�mci textu
        const rect = element.getBoundingClientRect();
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;

        sparkle.style.left = (rect.left + window.scrollX + x) + "px";
        sparkle.style.top = (rect.top + window.scrollY + y) + "px";

        // N�hodn� animace
        sparkle.style.animation = `sparkleAnim ${Math.random() * 0.5 + 0.5}s linear forwards`;

        document.body.appendChild(sparkle);

        // Odstran�n� jiskry po animaci
        setTimeout(() => sparkle.remove(), 1000);
    }, 150); // Jak rychle se jiskry objevuj� (men�� ��slo = v�c jisk�en�)
}

// Spust�me jisk�en� pro nadpis a instrukce
addSparklesToText("main-title");
addSparklesToText("initials");
addSparklesToText("wedding-date");

/*
function downloadIcs() {
    // Definice ud�losti (bez diakritiky pro maxim�ln� kompatibilitu)
    const title = "Svatba Anicky a Pitra";
    const location = "Zahradni a plesovy dum, Teplice";
    const startDate = "20260606T130000";
    const endDate = "20260606T235900";

    // Sestaven� obsahu ICS souboru
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "DTSTART:" + startDate,
        "DTEND:" + endDate,
        "SUMMARY:" + title,
        "LOCATION:" + location,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    // Vytvo�en� skryt�ho odkazu
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'svatba.ics');

    // Trik pro iPhone: p�id�n� do dokumentu a vynucen� kliknut�
    document.body.appendChild(link);
    link.click();

    // Vy�i�t�n� pam�ti
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 200);
}
*/

function addToCalendar() {
    const title = "Svatba Aničky a Péti";
    const details = "Zveme Vás na naši svatbu v kostele sv. Jana Křtitele v Teplicích.";
    const location = "Zámecké nám. 135, 415 01 Teplice 1";
    const startDate = "20260606T130000";
    const endDate = "20260606T235900";

    // 1. Zjistíme, zda je uživatel na zařízení od Apple (iPhone, iPad, Mac)
    const isApple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

    if (isApple) {
        // Pro Apple vytvoříme soubor .ics (v kalendáři se otevře jako nová událost)
        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            "URL:" + document.URL,
            "DTSTART:" + startDate,
            "DTEND:" + endDate,
            "SUMMARY:" + title,
            "DESCRIPTION:" + details,
            "LOCATION:" + location,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\n");

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'svatba.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        // Pro ostatní (Android, PC) použijeme Google Calendar link
        const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
        window.open(googleUrl, '_blank');
    }

}


function showInfo() {
    // Najdeme hlavní elementy úvodní strany (nadpis, srdce, instrukce atd.)
    const mainTitle = document.getElementById("main-title");
    const initials = document.getElementById("initials");
    const heart = document.querySelector(".heart-wrapper");
    const instruction = document.getElementById("instruction");
    const calendar = document.getElementById("calendar-wrapper");
    const infoPage = document.getElementById("info-page");

    // Skryjeme úvod (můžeš je buď smazat nebo jim dát display: none)
    mainTitle.style.display = "none";
    initials.style.display = "none";
    heart.style.display = "none";
    instruction.style.display = "none";
    calendar.style.display = "none";

    // Zobrazíme informační stránku
    infoPage.classList.remove("hidden");
}

function backToInvite() {
    // Pokud se host chce vrátit zpět, všechno zase prohodíme
    location.reload(); // Nejednodušší cesta, jak se vrátit do původního stavu
}

const form = document.getElementById('rsvp-form');
if (form) {
    form.addEventListener('submit', function (e) {
        // Necháme Formspree, aby udělalo svou práci (odeslání)
        // Ale přidáme malý trik, aby uživatel viděl potvrzení přímo u nás

        const formContainer = document.getElementById('rsvp-form');

        // Počkáme vteřinu a pak schováme formulář a ukážeme díky
        setTimeout(() => {
            formContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; animation: fadeIn 1s;">
                    <h3 style="font-family: 'Great Vibes', cursive; color: #b8860b; font-size: 2.5rem;">Děkujeme!</h3>
                    <p style="font-family: 'Archivo Narrow', sans-serif;">Vaše odpověď byla v pořádku odeslána. <br> Moc se na Vás těšíme!</p>
                </div>
            `;
        }, 500);
    });
}

function startCountdown() {
    const targetDate = new Date(2026, 5, 6, 10, 0, 0).getTime();

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff < 0) {
            clearInterval(timerInterval);
            // Pokud vyprší čas, vypíšeme zprávu do všech countdown kontejnerů
            document.querySelectorAll("#countdown, .countdown-container").forEach(el => {
                el.innerHTML = "<span style='color:#b8860b; font-size:1.2rem;'>Dnes je náš den! 💕</span>";
            });
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        // Zápis do prvního odpočtu (ID)
        const d1 = document.getElementById("days");
        const h1 = document.getElementById("hours");
        const m1 = document.getElementById("minutes");
        const s1 = document.getElementById("seconds");

        if (d1) d1.innerText = d;
        if (h1) h1.innerText = h.toString().padStart(2, '0');
        if (m1) m1.innerText = m.toString().padStart(2, '0');
        if (s1) s1.innerText = s.toString().padStart(2, '0');

        // Zápis do druhého odpočtu (Třídy na info stránce)
        const d2 = document.querySelector(".days-val");
        const h2 = document.querySelector(".hours-val");
        const m2 = document.querySelector(".minutes-val");
        const s2 = document.querySelector(".seconds-val");

        if (d2) d2.innerText = d;
        if (h2) h2.innerText = h.toString().padStart(2, '0');
        if (m2) m2.innerText = m.toString().padStart(2, '0');
        if (s2) s2.innerText = s.toString().padStart(2, '0');

    }, 1000);
}

// Spustit hned
startCountdown();
