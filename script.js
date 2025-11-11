document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://akabab.github.io/starwars-api/api/';
  const inputSearch = document.getElementById('inputSearch');
  const suggestionsList = document.getElementById('suggestions');

  let gridContainer = null;
  let answerTitles = null;
  let allCharacters = [];
  let randomCharacterData = null;

  suggestionsList.style.display = 'none';

  function normalizeToArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => v?.toString().toLowerCase().trim());
    return value.toString().split(/[,/]/).map(v => v.toLowerCase().trim());
  }

  async function initCharacters() {
    try {
      const response = await fetch(`${apiUrl}all.json`);
      allCharacters = (await response.json()).filter(c => c.image);

      const randomIndex = Math.floor(Math.random() * allCharacters.length);
      randomCharacterData = allCharacters[randomIndex];

      ["homeworld", "skinColor", "eyeColor"].forEach(field => {
        randomCharacterData[field] = normalizeToArray(randomCharacterData[field]);
      });

    } catch (error) {
      console.error('Error al cargar personajes:', error);
    }
  }

  function createGridHeaders() {
    gridContainer = document.createElement('div');
    gridContainer.className = 'gridContainer';

    answerTitles = document.createElement('div');
    answerTitles.className = 'answerTitles';

    const titles = ["Character", "Gender", "Skin color", "Eye color", "Height", "Mass", "Homeworld"];
    titles.forEach(title => {
      const div = document.createElement('div');
      div.className = 'nameTitle';

      const p = document.createElement('div');
      p.textContent = title;
      p.className = 'nameP';

      const hr = document.createElement('hr');
      hr.className = 'answerLine';

      div.appendChild(p);
      div.appendChild(hr);
      answerTitles.appendChild(div);
    });

    gridContainer.appendChild(answerTitles);
    document.body.appendChild(gridContainer);
  }

  initCharacters();
  createGridHeaders();

  inputSearch.addEventListener('input', debounce(searchStarWars, 200));

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function searchStarWars() {
    const searchTerm = inputSearch.value.trim().toLowerCase();
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none';
    if (!searchTerm) return;

    const results = allCharacters.filter(c => c.name.toLowerCase().includes(searchTerm));

    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No se encontraron resultados';
      li.style.pointerEvents = 'none';
      suggestionsList.appendChild(li);
      suggestionsList.style.display = 'block';
      return;
    }

    results.forEach(character => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      li.className = 'suggestionItem';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.padding = '4px 8px';
      li.style.borderBottom = '1px solid #ccc';

      const img = document.createElement('img');
      img.src = character.image;
      img.alt = character.name;
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.objectFit = 'cover';
      img.style.marginRight = '8px';
      img.style.borderRadius = '4px';

      const span = document.createElement('span');
      span.textContent = character.name;

      li.appendChild(img);
      li.appendChild(span);

      li.addEventListener('click', () => {
        inputSearch.value = '';
        suggestionsList.style.display = 'none';
        allCharacters = allCharacters.filter(c => c.name !== character.name);

        const answerContainer = document.createElement('div');
        answerContainer.className = 'answerContainer';
        answerContainer.style.display = 'grid';
        answerContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        answerContainer.style.gap = '4px';
        answerContainer.style.marginTop = '8px';

        const values = [
          character.image,
          character.gender,
          character.skinColor,
          character.eyeColor,
          character.height,
          character.mass,
          character.homeworld
        ];

        const keyMap = ["image", "gender", "skinColor", "eyeColor", "height", "mass", "homeworld"];

        values.forEach((value, index) => {
          const div = document.createElement('div');
          div.className = 'answer';
          div.style.padding = '4px';
          div.style.textAlign = 'center';
          div.style.animationDelay = `${index * 0.5}s`;

          if (index === 0) {
            const img = document.createElement('img');
            img.src = value;
            img.alt = character.name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            div.appendChild(img);
          } else {
            div.textContent = value;

            if (randomCharacterData) {
              const key = keyMap[index];
              const targetValue = randomCharacterData[key];

              if (["homeworld", "skinColor", "eyeColor"].includes(key)) {
                const valueArr = (value || '').toString().toLowerCase().split(/[,/]/).map(v => v.trim());
                const targetArr = Array.isArray(targetValue)
                  ? targetValue.map(v => v.toLowerCase().trim())
                  : String(targetValue || '').toLowerCase().split(/[,/]/).map(v => v.trim());

                if (valueArr.join(",") === targetArr.join(",")) {
                  div.style.backgroundColor = '#05BB2A';
                } else if (valueArr.some(v => targetArr.some(t => v.includes(t) || t.includes(v)))) {
                  div.style.backgroundColor = '#FFA500';
                } else {
                  div.style.backgroundColor = '#DA150F';
                }
                div.style.color = '#fff';
              } else {
                if (String(value || '').toLowerCase() === String(targetValue || '').toLowerCase()) {
                  div.style.backgroundColor = '#05BB2A';
                } else {
                  div.style.backgroundColor = '#DA150F';
                }
                div.style.color = '#fff';
              }
            }
          }

          answerContainer.appendChild(div);
        });

        if (gridContainer.children.length > 1) {
          gridContainer.insertBefore(answerContainer, gridContainer.children[1]);
        } else {
          gridContainer.appendChild(answerContainer);
        }

        if (character.name === randomCharacterData.name) {
          setTimeout(() => {
            showVictoryPopup(character);
          }, 3500);
        }
      });

      suggestionsList.appendChild(li);
    });

    if (document.activeElement === inputSearch && suggestionsList.children.length) {
      suggestionsList.style.display = 'block';
    }
  }

  inputSearch.addEventListener('blur', () => {
    setTimeout(() => {
      suggestionsList.style.display = 'none';
    }, 100);
  });

  inputSearch.addEventListener('focus', () => {
    if (inputSearch.value.trim()) searchStarWars();
  });



  function showVictoryPopup(character) {
    const overlay = document.createElement('div');
    overlay.classList.add('victory-overlay');

    const popup = document.createElement('div');
    popup.classList.add('victory-popup');

    const title = document.createElement('h2');
    title.textContent = 'Victory!';

    const content = document.createElement('div');
    content.classList.add('victory-content');

    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const message = document.createElement('p');
    message.classList.add('victory-message');
    message.textContent = `You guessed ${character.name}!`;

    content.appendChild(img);
    content.appendChild(message);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Play again';
    closeBtn.classList.add('victory-close-btn');

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      location.reload();
    });

    popup.appendChild(title);
    popup.appendChild(content);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);

    document.body.appendChild(overlay);
  }

});
