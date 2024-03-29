const urlUsers = 'https://mock-api.driven.com.br/api/v6/uol/participants'
const urlStatus = 'https://mock-api.driven.com.br/api/v6/uol/status'
const urlMessages = 'https://mock-api.driven.com.br/api/v6/uol/messages'

const view = {
    login: document.querySelector("[data-view='login']"),
    chat: document.querySelector("[data-view='chat']"),
    sidebar: document.querySelector("[data-view='sidebar']")
}

const modeOptions = Array.from(document.querySelectorAll("[data-mode]"))
const buttons = document.querySelectorAll("[data-button]")
const inputs = document.querySelectorAll('[data-input]')
const users = document.querySelector('[data-users]')

const sendingOptions = {
    user: {
        value: "Todos",
        element: document.querySelector('[data-user]')
    },
    mode: {
        value: "message",
        element: modeOptions[0]
    }
}

let username

//======================================================================

view.sidebar.addEventListener('click', e => {
    const area = e.target
    if (area.hasAttribute('data-view')) {
        toggleSmoothSidebar()
        toggleSmoothBackground()
        setTimeout( ()=> area.classList.toggle('hidden'), 300)
    }
})

buttons.forEach(button => {
    button.addEventListener('click', e => {
        selectedButton = e.currentTarget
        const buttonType = selectedButton.getAttribute('data-button')
        if (buttonType === "login") {
            getUsername()
            toggleLoadingView()
            updateUsername(username)
        } else if (buttonType === 'options') {
            view.sidebar.classList.toggle('hidden')
            toggleSmoothSidebar()
            toggleSmoothBackground()
        } else {
            sendMessageFromInput()
        }
    })
})

inputs.forEach(input => {
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            const selectedInput = e.currentTarget
            const inputType = selectedInput.getAttribute('data-input')
            if (inputType === 'username') {
                getUsername()
                toggleLoadingView()
                updateUsername(username)
            } else {
                sendMessageFromInput()
            }
        }
    })
})

modeOptions.forEach(mode => {
    mode.addEventListener('click', e => {
        const selectedOption = e.currentTarget
        addEventHandlerForModeOptions(selectedOption, 'mode')
    })
})

//======================================================================

function addEventHandlerForModeOptions(target,category) {
    const value = target.getAttribute(`data-${category}`)
    toggleOptionCheck(sendingOptions[category].element)
    updateOption(category, value, target)
    toggleOptionCheck(target)
}

function addEventHandlerForUserOptions(target,category) {
    const value = target.getAttribute(`data-${category}`)
    toggleUserOptionCheck()
    updateOption(category, value, target)
    toggleUserOptionCheck()
}

function updateOption(category, value, element) {
    sendingOptions[category].element = element
    sendingOptions[category].value = value
    console.log(`Opção ${category} mudada para ${value}`)
    updateInfo()
}

function toggleOptionCheck(opt) {
    const img = opt.querySelector('img')
    img.classList.toggle('hidden')
}

function toggleUserOptionCheck() {
    const users = document.querySelectorAll('[data-user]')
    const value = sendingOptions.user.value
    users.forEach(user => {
        const userValue = user.querySelector('span').innerHTML
        if (value === userValue) {
            toggleOptionCheck(user)
        }
    })
}

function updateInfo() {
    const info = document.querySelector('[data-info]')
    let content
    switch (sendingOptions.mode.value) {
        case 'message':
            content = `Enviando para ${sendingOptions.user.value}`
            break
        case 'private_message':
            content = `Enviando para ${sendingOptions.user.value} (reservadamente)`
            break
    }
    info.innerHTML = content
}

//======================================================================

function updateUsername(username) {
    const data = {name: username}
    axios.post(urlUsers, data)
    .then(() => {
        updateInfo()
        updateChat()
        updateActiveUsers()
        toggleOptionCheck(sendingOptions.mode.element)
        view.login.classList.toggle('hidden')
        setInterval(() => {
            axios.post(urlStatus, data)
        }, 5000)
        setInterval(() => {
            updateChat()
        }, 3000)
        setInterval(() => {
            updateActiveUsers()
        }, 10000)
    })
    .catch(() => {
        alert(`"${username}" já está em uso, por favor insira um novo nome!`)
        username = ''
        toggleLoadingView()
    })
}

function getUsername() {
    const input = document.querySelector("[data-input='username']")
    username = input.value
    input.value = ''
}

function toggleLoadingView() {
    const loading = document.querySelector('.login__loading')
    const text = document.querySelector("[data-input='username']")
    const button = document.querySelector("[data-button='login']")

    if (loading.classList.contains('hidden')) {
        text.classList.add('hidden')
        button.classList.add('hidden')
        loading.classList.remove('hidden')
    } else {
        text.classList.remove('hidden')
        button.classList.remove('hidden')
        loading.classList.add('hidden')
        text.focus()
    }
}

//======================================================================

function sendMessageFromInput() {
    const input = document.querySelector('[data-input="message"]')
    const text = input.value
    if(text !== '') {
        sendMessage(
            username,
            sendingOptions.user.value,
            text,
            sendingOptions.mode.value
        )
    } else {
        alert('Digite alguma mensagem!')
    }
    input.value = ""
}

function sendMessage(from, to, text, type) {
    const data = {
        from: from,
        to: to,
        text: text,
        type: type
    }
    axios.post(urlMessages, data)
    .then(() => {
        updateChat()
        console.log('Mensagem enviada!')
    })
    .catch(error => {
        alert(`Erro ao enviar mensagem: ${error.response.status}`)
        window.location.reload()
    })
}

//======================================================================

function updateChat() {
    axios.get(urlMessages).then((response => {
        view.chat.innerHTML = ''
        const messages = response.data.filter(msg => {
            return msg.type !== "private_message" || msg.from === username || msg.to === username
        })
        messages.forEach(message => {
            createMessage(message)
        })
        const chatMessages = Array.from(document.querySelectorAll('.chat-message'))
        const lastMessage = chatMessages.at(-1)
        lastMessage.scrollIntoView()
    }))
}

function createMessage(obj) {
    const type = obj.type
    let info
    switch (type) {
        case "status":
            info = `<strong>${obj.from}</strong>`
            break
        case "message":
            info = `<strong>${obj.from}</strong> para <strong>${obj.to}</strong>:`
            break
        case "private_message":
            info = `<strong>${obj.from}</strong> reservadamente para <strong>${obj.to}</strong>:`
            break
    }
    const message = createHtmlElement('div', ['chat-message', type], '')
    message.setAttribute("data-test", "message")
    const messageElements = [
        createHtmlElement('span', ['chat-message__time'], `(${obj.time})`),
        createHtmlElement('span', ['chat-message__info'], info),
        createHtmlElement('span', ['chat-message__text'], obj.text)
    ]
    messageElements.forEach(element => {
        message.appendChild(element)
    })
    view.chat.append(message)
}

function createHtmlElement(tag, classes, content) {
    const element = document.createElement(tag)
    classes.forEach(htmlClass => {
        element.classList.add(htmlClass)
    })
    element.innerHTML = content
    return element
}

//======================================================================

function updateActiveUsers() {
    const html = `<li data-user="Todos" data-identifier="participant" data-test="all">
                        <button>
                            <ion-icon name="people"></ion-icon>
                            <div>
                                <span>Todos</span>
                                <img class="hidden" src="./assets/check.svg" alt="check">
                            </div>
                        </button>
                    </li>`
    axios.get(urlUsers).then(response => {
        const objs = response.data
        users.innerHTML = html
        objs.forEach(user => {
            createUser(user, users)
        })
        const userOptions = document.querySelectorAll('[data-user]')
        userOptions.forEach(option => {
            option.addEventListener('click', e => {
                const selectedUser = e.currentTarget
                addEventHandlerForUserOptions(selectedUser, 'user')
            })
        })
        toggleUserOptionCheck()
    })    
}

function createUser(obj, parent) {
    const name = obj.name
    const html = `<button>
                        <ion-icon name="person-circle"></ion-icon>
                        <div>
                            <span>${name}</span>
                            <img data-test="check" class="hidden" src="./assets/check.svg" alt="check">
                        </div>
                    </button>`
    const user = createHtmlElement('li', [], html)
    user.setAttribute("data-user", name)
    user.setAttribute("data-test", "participant")
    user.setAttribute("data-identifier","participant")
    parent.appendChild(user)
}

function toggleSmoothSidebar() {
    const asideClasses = view.sidebar.querySelector('aside').classList

    if (asideClasses.contains('move-left')) {
        asideClasses.remove('move-left')
        asideClasses.add('move-right')
    } else if (asideClasses.contains('move-right')) {
        asideClasses.remove('move-right')
        asideClasses.add('move-left')
    } else {
        asideClasses.add('move-left')
    }
}

function toggleSmoothBackground() {
    const sidebarClasses = view.sidebar.classList

    if (sidebarClasses.contains('background-in')) {
        sidebarClasses.remove('background-in')
        sidebarClasses.add('background-out')
    } else if (sidebarClasses.contains('background-out')) {
        sidebarClasses.remove('background-out')
        sidebarClasses.add('background-in')
    } else {
        sidebarClasses.add('background-in')
    }
}
