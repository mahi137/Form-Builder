import { element, exportDataInJSONFile, listen, localStorage, showAlert } from './core.js'

window.addEventListener('DOMContentLoaded', () => {
    const LEFT_SIDEBAR_BTN = element('.button_left-sidebar');
    const RIGHT_SIDEBAR_BTN = element('.button_right-sidebar');
    const SIDEBAR_BODY = element('.sidebar__body');
    const EDITOR = element('.main .editor');
    const MAIN = element('.main');
    const JSON_TAB = element('.tab_json');
    const LAYOUT_TAB = element('.tab_layout');


    const ID = window.location.search.slice(4);

    const formStorage = localStorage('forms')
    const currentData = (formStorage() || []);

    // currently we'll add a new form if form doesn't found.
    if (currentData.some(form => form.id != ID)) {
        currentData.push({ id: Math.random(), title: 'Untitled form', data: [] })
    }

    // get the our form information
    let PAGE = currentData.filter(form => form.id == ID)[0];
    let PREV_ACTIVE_ID = -1, CURRENT_ACTIVE_ID = -1; // Hold active ID
    let activeTab = 'layout'; // active tab in right sidebar


    // Drag and drop listeners
    const onDraggingStart = (event) => {
        const PARENT = event.target.parentNode.parentNode.parentNode;
        const HAS_ACTIVE = PARENT.classList.contains('active');
        PARENT.classList.remove('active');
        PARENT.classList.add('grabbing');

        const ITEM_HEIGHT = PARENT.offsetHeight + 16;
        const BODY_HEIGHT = SIDEBAR_BODY.offsetHeight;
        const BODY_TOP = SIDEBAR_BODY.getBoundingClientRect().y;

        const DUMMY_NODE = document.createElement('div');
        DUMMY_NODE.style.width = '100%';
        DUMMY_NODE.style.height = ITEM_HEIGHT + 'px';

        let CURRENT_INDEX = Math.floor((PARENT.getBoundingClientRect().y - BODY_TOP) / ITEM_HEIGHT);
        SIDEBAR_BODY.insertBefore(DUMMY_NODE, SIDEBAR_BODY.childNodes[CURRENT_INDEX])

        const PREVIOUS_INDEX = CURRENT_INDEX;
        const dragEvent = listen(PARENT, 'dragstart', (event) => {
            // Prevent default browser drag behavior
            event.preventDefault();
        });

        let Y1, Y2 = BODY_TOP + BODY_HEIGHT, TP, I1;
        const moveEvent = listen(SIDEBAR_BODY, 'mousemove', (event) => {
            Y1 = event.clientY - BODY_TOP;
            TP = (Y1 < 0 ? 0 : Y1 > Y2 ? Y2 : Y1);
            I1 = Math.floor(TP / ITEM_HEIGHT) + 1;

            if (CURRENT_INDEX != I1) {
                CURRENT_INDEX = I1 > CURRENT_INDEX
                    ? I1 + 1 : I1;

                SIDEBAR_BODY.insertBefore(
                    DUMMY_NODE,
                    SIDEBAR_BODY.childNodes[CURRENT_INDEX]
                )
            }

            // // PARENT.offsetTop
            PARENT.style.top = TP + 'px';
        })

        const upEvent = listen(SIDEBAR_BODY, 'mouseup', () => {
            PARENT.classList.remove('grabbing');
            moveEvent(), upEvent(), dragEvent();

            PARENT.style.top = ''
            SIDEBAR_BODY.removeChild(DUMMY_NODE);

            if (HAS_ACTIVE) {
                PARENT.classList.add('active');
            }

            if (CURRENT_INDEX != -1) {
                SIDEBAR_BODY.insertBefore(PARENT, SIDEBAR_BODY.childNodes[CURRENT_INDEX])
                console.log(PREVIOUS_INDEX, CURRENT_INDEX - 1)
            }

            // renderChanges();
        })
    }

    const addLayoutItem = (type) => {
        PREV_ACTIVE_ID = CURRENT_ACTIVE_ID;

        PAGE.data.push({
            id: CURRENT_ACTIVE_ID = Math.random(),
            type: type,
            ...(type == 'heading' || type == 'paragraph'
                ? { textContent: "Text goes here...", align: 'left' }
                : {
                    label: "Dummy Label",
                    placeholder: "Dummy placeholder"
                }),
            ...(type == 'choice' ? { choice: [] } : {})
        })

        renderChanges();
    }

    const openItemEditor = () => {
        SIDEBAR_BODY.childNodes.forEach(node => {
            // DeActive previous opened item editor
            if (PREV_ACTIVE_ID == node.id) {
                node.classList.remove('active')

                const body = element('.item__body', node);
                if (body) node.removeChild(body);
            }

            if (node.id == CURRENT_ACTIVE_ID) {
                const data = PAGE.data.filter(item => item.id == CURRENT_ACTIVE_ID)[0];
                const isHeading = data.type == 'heading' || data.type == 'paragraph';
                const needPlaceHolder = !isHeading && data.type != 'checkbox';

                const body = document.createElement('div');
                body.className = 'item__body';

                body.innerHTML = `
                    <h6>Basic</h6>
                    ${isHeading ?
                        `<input type="text" class="input input_text" placeholder="Content" value="${data.textContent}">` :
                        `<input type="text" class="input input_label" placeholder="Label" value="${data.label}">`}
                    ${needPlaceHolder ? `<input type="text" class="input input_placeholder" placeholder="Placeholder" value="${data.placeholder}">` : ''}

                    ${data.type == 'choice' ? `
                        <div class="divider"></div>

                        <h6>Options</h6>
                        <textarea name="Options" class="input input_area" placehodler="Items seperated by newlines, ex. item1,item2,...">${data.choice}</textarea>
                    `: ''}
                    ${data.type == 'heading' || data.type == 'paragraph' ? `
                    <div class="divider"></div>
                    <h6>Alignment</h6>

                    <div class="item__alignment">
                        <button class="button button_icon button_left${data.align == 'left' ? ' active' : ''}" title="Align left" type="button">
                            <svg viewBox="0 0 24 24" data-name="Flat Line"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M3,12H15M3,6H21M3,18H15"
                                    style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;">
                                </path>
                            </svg>
                        </button>
                        <button class="button button_icon button_center${data.align == 'center' ? ' active' : ''}" title="Align center" type="button">
                            <svg viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 4.5H21" stroke="#292D32" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M7.26001 9.5H16.74" stroke="#292D32" stroke-width="1.5"
                                    stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M3 14.5H21" stroke="#292D32" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M7.26001 19.5H16.74" stroke="#292D32" stroke-width="1.5"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                        <button class="button button_icon button_right${data.align == 'right' ? ' active' : ''}" title="Align right" type="button">
                            <svg viewBox="0 0 24 24" id="alignment-right"
                                data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line">
                                <path id="primary" d="M21,12H9M3,6H21m0,12H9"
                                    style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;">
                                </path>
                            </svg>
                        </button>
                    </div>` : ''}
                    `
                node.appendChild(body);
                node.classList.add('active');

                // add listeners
                const textInput = element('.input_text', body)
                const labelInput = element('.input_label', body)
                const placeholderInput = element('.input_placeholder', body)
                const areaInput = element('.input_area', body)
                const leftBtn = element('.button_left', body)
                const centerBtn = element('.button_center', body)
                const rightBtn = element('.button_right', body)

                if (isHeading) {
                    listen(textInput, 'change', () => {
                        console.log("ETXT:")
                        data.textContent = textInput.value;
                        renderChanges();
                    });

                    listen(leftBtn, 'click', () => {
                        data.align = 'left';
                        renderChanges();
                    })

                    listen(centerBtn, 'click', () => {
                        data.align = 'center';
                        renderChanges();
                    })

                    listen(rightBtn, 'click', () => {
                        data.align = 'right';
                        renderChanges();
                    })
                } else {
                    listen(labelInput, 'change', () => {
                        data.label = labelInput.value;
                        renderChanges();
                    })
                }

                if (needPlaceHolder) {
                    listen(placeholderInput, 'change', () => {
                        data.placeholder = placeholderInput.value;
                        renderChanges()
                    })
                }

                if (data.choice) {
                    listen(areaInput, 'change', () => {
                        data.choice = areaInput.value.split(/\r?\n/);
                        renderChanges()
                    })
                }
            }
        })
    }

    const renderChanges = () => {
        const editorData = PAGE.data.map((data) => {
            if (data.type == 'heading') {
                return `<h2 style="text-align: ${data.align}">${data.textContent}</h2>`
            }

            else if (data.type == 'paragraph') {
                return `<p style="text-align: ${data.align}">${data.textContent}</p>`
            }

            else if (data.type == 'input') {
                return `
                    ${data.label ? `<label for="${data.label}">${data.label}</label>` : ''}
                    <input type="text" class="input" id="${data.label}" placeholder="${data.placeholder}" />
                `
            }

            else if (data.type == 'textarea') {
                return `
                    ${data.label ? `<label for="${data.label}">${data.label}</label>` : ''}
                    <textarea class="input" id="${data.label}" placeholder="${data.placeholder}"></textarea>
                `
            }

            else if (data.type == 'checkbox') {
                return `<div class="checkbox-group">
                    <input type="checkbox" class="checkbox" id="${data.label}" />
                    ${data.label ? `<label for="${data.label}">${data.label}</label>` : ''}
                </div>`
            }

            else {
                return `
                    ${data.label ? `<label for="${data.label}">${data.label}</label>` : ''}
                    <select class="input" id="${data.label}">
                        ${data.placeholder ? `<option value="" selected disabled>${data.placeholder}</option>` : ''}
                        ${data.choice.map(option => (`<option value="${option}">${option}</option>`)).join("")}
                    </select>
                `
            }
        }).join("");

        const layoutData = activeTab == 'layout' ? PAGE.data.map((data) => (`<div class="item" id="${data.id}" type="${data.type}" >
                <div class="item__header">
                    <h5>${data.type == 'choice' ? 'Multiple choice' : data.type}</h5>

                    <div class="item__ctrl">
                       
                        <button class="button button_icon button_edit" type="button" title="Edit item">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M18.9445 9.1875L14.9445 5.1875M18.9445 9.1875L13.946 14.1859C13.2873 14.8446 12.4878 15.3646 11.5699 15.5229C10.6431 15.6828 9.49294 15.736 8.94444 15.1875C8.39595 14.639 8.44915 13.4888 8.609 12.562C8.76731 11.6441 9.28735 10.8446 9.946 10.1859L14.9445 5.1875M18.9445 9.1875C18.9445 9.1875 21.9444 6.1875 19.9444 4.1875C17.9444 2.1875 14.9445 5.1875 14.9445 5.1875M20.5 12C20.5 18.5 18.5 20.5 12 20.5C5.5 20.5 3.5 18.5 3.5 12C3.5 5.5 5.5 3.5 12 3.5"
                                    stroke="#000000" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </button>
                        <button class="button button_icon button_trash" type="button" title="Remove item">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
                                stroke="#000000" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                        <button class="button button_icon button_drag" type="button" title="Drag & drop">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 10H19M14 19L12 21L10 19M14 5L12 3L10 5M5 14H19" stroke="#000000"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`)).reverse().join("") : '';

        EDITOR.innerHTML = editorData;
        SIDEBAR_BODY.innerHTML = layoutData;

        // also open edit mode for layout items
        openItemEditor();

        // Store new changed in local storage
        const previousData = formStorage();
        for (const d of previousData) {
            if (d.id == ID) {
                d.data = PAGE.data;
                break;
            }
        }
        formStorage(previousData)
    }

    /** TAB LISTENERS */
    listen(LAYOUT_TAB, 'click', () => {
        activeTab = 'layout';
        JSON_TAB.classList.remove('active')
        LAYOUT_TAB.classList.add('active')
    })

    listen(element('.tab_json'), 'click', () => {
        activeTab = 'json';
        LAYOUT_TAB.classList.remove('active')
        JSON_TAB.classList.add('active')
    })

    // listeners for left sidebar
    element('.sidebar .navbar').childNodes.forEach((node) => {
        listen(node, 'click', () => {
            addLayoutItem(node.getAttribute('data-type'));
        })
    })

    // when user click on download button
    listen(element('.button_download'), 'click', () => {
        exportDataInJSONFile(PAGE)
        showAlert("Form is downloading...")
    })

    // when user upload custom json file
    listen(element('.button_upload'), 'click', () => {
        const inputElement = document.createElement('input')
        inputElement.type = 'file'
        document.body.appendChild(inputElement)

        inputElement.click();

        listen(inputElement, 'change', (e) => {
            const reader = new FileReader();
            reader.readAsText(e.target.files[0]);

            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    currentData.push(PAGE = {
                        id: Math.random(),
                        title: data.title || 'Untitled form',
                        data: Array.isArray(data.data) ? data.data : []
                    })

                    renderChanges();
                    showAlert("Form is updated from your JSON file.")
                } catch (err) {
                    showAlert("An error occured while parsing JSON file.")
                }
            }

            document.body.removeChild(inputElement)
        })
    })

    // item button listeners, ex. edit, delete, drag-drop
    listen(SIDEBAR_BODY, 'click', (event) => {
        const ID = event.target.parentNode.parentNode.parentNode.id;
        const className = event.target.classList;

        if (className.contains('button_trash')) {
            PAGE.data = PAGE.data.filter(item => item.id != ID);
            renderChanges();
        } else if (className.contains('button_edit')) {
            if (CURRENT_ACTIVE_ID == ID) {
                PREV_ACTIVE_ID = CURRENT_ACTIVE_ID;
                CURRENT_ACTIVE_ID = -1;
            } else {
                PREV_ACTIVE_ID = CURRENT_ACTIVE_ID;
                CURRENT_ACTIVE_ID = ID;
            }

            openItemEditor();
        }
    })

    // mousedown listener for dragging functionality
    listen(SIDEBAR_BODY, 'mousedown', (event) => {
        if (event.target.classList.contains('button_drag')) {
            onDraggingStart(event);
        }
    })

    // Initial rendering
    renderChanges();

    /**
     * SIDEBAR FUNCTIONALLITY IS BELOW
     */

    // sidebar button listeners
    listen(LEFT_SIDEBAR_BTN, 'click', (event) => {
        if (event.target.classList.contains('active')) {
            event.target.classList.remove('active')
            MAIN.classList.remove('main_left')
        } else {
            event.target.classList.add('active')
            MAIN.classList.add('main_left')
        }
    })

    listen(RIGHT_SIDEBAR_BTN, 'click', (event) => {
        if (event.target.classList.contains('active')) {
            event.target.classList.remove('active')
            MAIN.classList.remove('main_right')
        } else {
            event.target.classList.add('active')
            MAIN.classList.add('main_right')
        }
    })

    const checkForSidebarInSmallDevices = () => {
        if (window.innerWidth < 1049) {
            RIGHT_SIDEBAR_BTN.classList.remove('active')
            MAIN.classList.remove('main_right')
        } else {
            RIGHT_SIDEBAR_BTN.classList.add('active')
            MAIN.classList.add('main_right')
        }

        if (window.innerWidth < 783) {
            LEFT_SIDEBAR_BTN.classList.remove('active')
            MAIN.classList.remove('main_left')
        } else {
            LEFT_SIDEBAR_BTN.classList.add('active')
            MAIN.classList.add('main_left')
        }
    }

    listen(window, 'resize', checkForSidebarInSmallDevices)
    checkForSidebarInSmallDevices(); // initial measurments

}) 