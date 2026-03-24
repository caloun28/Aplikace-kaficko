const url = "https://crm.skch.cz/ajax0/procedure2.php";

function make_base_auth(user, password) {
    return "Basic " + btoa(user + ":" + password);
}

const username = "coffe";
const password = "kafe";
const AUTH_HEADER = make_base_auth(username, password);

async function getTypesList(apiUrl) {
    const res = await fetch(`${apiUrl}?cmd=getTypesList`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': AUTH_HEADER
        }
    });

    if (!res.ok) throw new Error(`getTypesList HTTP ${res.status}`);
    return await res.json();
}

async function getPeopleList(apiUrl) {
    const res = await fetch(`${apiUrl}?cmd=getPeopleList`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': AUTH_HEADER
        }
    });

    if (!res.ok) throw new Error(`getPeopleList HTTP ${res.status}`);
    return await res.json();
}

function el(tag, attributes = {}, ...children) {
    const elem = document.createElement(tag);
    Object.entries(attributes).forEach(([key, val]) => {
        if (key === 'class')
            elem.className = val;
        else if (key === 'dataset')
            Object.assign(elem.dataset, val);
        else if (key in elem)
            elem[key] = val;
        else
            elem.setAttribute(key, val);

    });

    children.forEach(c => {
        if (typeof c === 'string')
            elem.appendChild(document.createTextNode(String(c)));
        else if (typeof c === 'number')
            elem.appendChild(document.createTextNode(String(c)));
        else if (c instanceof Node)

            elem.appendChild(c);
    });
    return elem;
}

function renderPeople(formEl, people) {
    const lastUser = localStorage.getItem('lastUser');
    const lastUserCookies = getCookie('lastUserCookie');
    const fieldset = el('fieldset', { class: "people" },
        el('legend', {}, 'Uživatel')
    );

    Object.values(people).forEach(p => {
        const id = String(p.name);
        const radio = el('input', {
            type: 'radio', class: "radio", id, name: 'user', value: String(p.ID), required: true, checked: lastUser === String(p.ID), checked: lastUserCookies === String(p.ID)
        });
        const label = el('label', { htmlFor: id, class: 'userLabel' }, p.name);

        const div = el('div', { class: 'user-row' });
        div.appendChild(radio);
        div.appendChild(label);
        fieldset.appendChild(div)
    });

    formEl.insertBefore(fieldset, formEl.firstChild);
}

function renderTypes(formEl, types) {
    const fieldset = el('fieldset', { class: "type-fieldset" },
        el('legend', {}, 'Typ')
    );

    const btn = el('button', { class: "submit-btn", type: 'submit' }, 'Odeslat');


    Object.values(types).forEach(t => {
        const number = el('input', {
            type: 'number', class: "count", min: "0", max: "99", name: 'type', value: "0", required: true
        });
        const div = el('div', { class: 'type' });
        const name = el('span', { class: 'typeName' }, t.typ);
        fieldset.appendChild(div);
        div.appendChild(name);
        div.appendChild(number);
        fieldset.appendChild(el('br'));
        fieldset.appendChild(btn);
    });
    formEl.appendChild(fieldset);
}

document.addEventListener('DOMContentLoaded', () => {

    const form = document.querySelector("#form");



    getPeopleList(url)
        .then(people => {
            renderPeople(form, people);
        })
        .catch(err => {
            console.error("Chyba při načítání lidí:", err);
        });

    getTypesList(url)
        .then(types => {
            renderTypes(form, types);
        })
        .catch(err => {
            console.error("Chyba při načítání typů:", err);
        });


    document.getElementById("form").addEventListener("submit", async function (e) {
        e.preventDefault();

        const payload = {
            user: null,
            drinks: []
        }

        payload.user = UserID();

        const countInput = document.querySelectorAll(".count");
        const drinkLabel = document.querySelectorAll(".typeName");
        var sum = 0;

        for (let index = 0; index < countInput.length; index++) {

            const drink = {
                type: drinkLabel[index].textContent,
                value: Number(countInput[index].value)
            }
            sum += Number(countInput[index].value);
            payload.drinks.push(drink)

        }

        if (sum === 0) {
            window.alert("Musite vybrat aspon 1 drink");
            return;
        }
        console.log(JSON.stringify(payload))

        try {
            await fetch(url + "?cmd=saveDrinks", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH_HEADER
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        } catch (error) {

            let offlineData = [];
            const savedData = localStorage.getItem("offData");

            if (savedData) {
                offlineData = JSON.parse(savedData);
            }

            offlineData.push(payload);
            localStorage.setItem("offData", JSON.stringify(offlineData));
        }


        const selectedUserId = UserID();

        if (selectedUserId) {
            localStorage.setItem('lastUser', selectedUserId);
            setCookie('lastUserCookie', selectedUserId, 30);
        }
    });;

    console.log(navigator.cookieEnabled)

    SendAgain();
});

function SendAgain() {

    setInterval(async () => {
        const savedData = localStorage.getItem("offData");

        if (savedData) {
            let offlineData = JSON.parse(savedData);
            let remainData = [];

            for (const data of offlineData) {
                try {
                    const result = await fetch(url + "?cmd=saveDrinks", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': AUTH_HEADER
                        },
                        credentials: 'include',
                        body: JSON.stringify(data)
                    });

                    const submitBtn = document.querySelector(".submit-btn");
                    submitBtn.style.backgroundColor = "#4CAF50";
                    submitBtn.style.color = "white";

                    setTimeout(() => {
                        submitBtn.style.backgroundColor = "";
                        submitBtn.style.color = "";
                    }, 3000);

                    if (!result.ok) {
                        remainData.push(data);
                    }

                } catch (error) {
                    remainData.push(data);
                }
            }

            if (remainData.length > 0) {
                localStorage.setItem("offData", JSON.stringify(remainData))
            } else {
                localStorage.removeItem("offData");
            }
        }
    }, 5000);

}

function UserID() {
    const radioInputs = document.querySelectorAll(".radio");
    var sum = 0;
    for (const radio of radioInputs) {
        if (radio.checked) {
            sum += radio.value;
            return radio.value;
        }

    }
    return null;
}


function setCookie(userID, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    let expires = "expires =" + date.toUTCString();

    document.cookie = `${userID}=${value}; ${expires}; path=/`;
}

function getCookie(userID) {
    const cookiesDec = decodeURIComponent(document.cookie);
    const cookies = cookiesDec.split('; ');
    let result = null;

    cookies.forEach(el => {
        if (el.indexOf(userID) == 0) {
            result = el.substring(userID.length + 1);
        }
    })
    return result;
}





