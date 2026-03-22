// Data for the interactive "Choose your version of me" section.
const modeContent = {
  serious: {
    title: 'Serious Mode 🧠',
    description:
      'Thinking about life, discipline, and trying to fix myself… but only sometimes 😄',
  },
  lazy: {
    title: 'Lazy Mode 😴',
    description:
      'Procrastination pro. Will do everything… except the thing I’m supposed to do.',
  },
  exam: {
    title: 'Exam Mode 📚',
    description:
      'Suddenly becomes productive. Panic + motivation combo pack.',
  },
  real: {
    title: 'Real Me 😄',
    description:
      'Introverted at first, but once I get comfortable, I talk normally (sometimes too much).',
  },
};

const modeButtons = document.querySelectorAll('.mode-button');
const modeCard = document.querySelector('.mode-card');
const modeTitle = document.getElementById('mode-title');
const modeDescription = document.getElementById('mode-description');
const faqQuestions = document.querySelectorAll('.faq-question');
const secretButton = document.getElementById('secret-button');
const secretMessage = document.getElementById('secret-message');
const revealItems = document.querySelectorAll('.reveal');

// Smoothly switch the card content whenever a mode button is clicked.
function updateModeCard(modeKey) {
  const selectedMode = modeContent[modeKey];

  if (!selectedMode) {
    return;
  }

  modeCard.classList.add('is-switching');

  window.setTimeout(() => {
    modeTitle.textContent = selectedMode.title;
    modeDescription.textContent = selectedMode.description;
    modeCard.classList.remove('is-switching');
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
    updateModeCard(button.dataset.mode);
  });
});

// Accordion behavior for the FAQ section.
faqQuestions.forEach((questionButton) => {
  questionButton.addEventListener('click', () => {
    const faqItem = questionButton.parentElement;
    const answer = questionButton.nextElementSibling;
    const isOpen = faqItem.classList.contains('is-open');

    faqQuestions.forEach((button) => {
      const item = button.parentElement;
      const panel = button.nextElementSibling;

      item.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = null;
    });

    if (!isOpen) {
      faqItem.classList.add('is-open');
      questionButton.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

// Small easter egg reveal at the bottom of the page.
secretButton.addEventListener('click', () => {
  const messageVisible = secretMessage.classList.contains('is-visible');

  if (messageVisible) {
    secretMessage.classList.remove('is-visible');

    window.setTimeout(() => {
      secretMessage.hidden = true;
    }, 220);

    return;
  }

  secretMessage.hidden = false;

  window.requestAnimationFrame(() => {
    secretMessage.classList.add('is-visible');
  });
});

// Fade-in on scroll using IntersectionObserver.
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealItems.forEach((item) => {
  if (!item.classList.contains('is-visible')) {
    revealObserver.observe(item);
  }
});
