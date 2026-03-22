// Content for the interactive "Choose your version of me" section.
const modes = {
  serious: {
    title: 'Serious Mode 🧠',
    text: 'Thinking about life, discipline, and trying to fix myself… but only sometimes 😄',
  },
  lazy: {
    title: 'Lazy Mode 😴',
    text: 'Procrastination pro. Will do everything… except the thing I’m supposed to do.',
  },
  exam: {
    title: 'Exam Mode 📚',
    text: 'Suddenly becomes productive. Panic + motivation combo pack.',
  },
  real: {
    title: 'Real Me 😄',
    text: 'Introverted at first, but once I get comfortable, I talk normally (sometimes too much).',
  },
};

const modeButtons = document.querySelectorAll('.mode-button');
const modePanel = document.getElementById('mode-panel');
const modeTitle = document.getElementById('mode-title');
const modeText = document.getElementById('mode-text');
const faqButtons = document.querySelectorAll('.faq-question');
const secretButton = document.getElementById('secret-button');
const secretMessage = document.getElementById('secret-message');
const revealItems = document.querySelectorAll('.reveal');

// Update the text card when a different mode button is clicked.
function showMode(modeKey) {
  const selectedMode = modes[modeKey];

  if (!selectedMode) {
    return;
  }

  modePanel.classList.add('is-switching');

  window.setTimeout(() => {
    modeTitle.textContent = selectedMode.title;
    modeText.textContent = selectedMode.text;
    modePanel.classList.remove('is-switching');
  }, 140);
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((item) => {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });

    button.classList.add('is-active');
    button.setAttribute('aria-selected', 'true');
    showMode(button.dataset.mode);
  });
});

// FAQ accordion with smooth expand / collapse.
faqButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.parentElement;
    const answer = button.nextElementSibling;
    const isOpen = item.classList.contains('is-open');

    faqButtons.forEach((otherButton) => {
      const otherItem = otherButton.parentElement;
      const otherAnswer = otherButton.nextElementSibling;

      otherItem.classList.remove('is-open');
      otherButton.setAttribute('aria-expanded', 'false');
      otherAnswer.style.maxHeight = null;
    });

    if (!isOpen) {
      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

// Easter egg message toggle.
secretButton.addEventListener('click', () => {
  const isVisible = secretMessage.classList.contains('show');

  if (isVisible) {
    secretMessage.classList.remove('show');

    window.setTimeout(() => {
      secretMessage.hidden = true;
    }, 220);

    return;
  }

  secretMessage.hidden = false;

  window.requestAnimationFrame(() => {
    secretMessage.classList.add('show');
  });
});

// Reveal sections gently as they appear on screen.
const observer = new IntersectionObserver(
  (entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealItems.forEach((item) => {
  if (!item.classList.contains('is-visible')) {
    observer.observe(item);
  }
});
