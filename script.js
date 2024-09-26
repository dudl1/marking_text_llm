/*
Copyright (c) 2024-2024 Valery Zinovev

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/




const selectFile = document.querySelector('.button_select_file')
const fileName = document.querySelector('.file_name')
const fileInput = document.getElementById('fileInput')
const fileContent = document.querySelector('.file_content')
const tableBody = document.querySelector('#csvTable tbody')
let selectedFile = null

function truncateFileName(name, maxLength) {
    if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...'
    }
    return name
}

selectFile.addEventListener('click', function () {
    fileInput.click()
})

fileInput.addEventListener('change', function (event) {
    selectedFile = event.target.files[0]
    if (selectedFile) {
        const truncatedFileName = truncateFileName(selectedFile.name, 15)
        fileName.textContent = truncatedFileName

        const reader = new FileReader()
        reader.onload = function(e) {
            const content = e.target.result
            parseCSV(content)
            fileContent.classList.add("active")
        }
        reader.readAsText(selectedFile)
    }
})

function parseCSV(csv) {
    const rows = csv.split('\n').map(row => row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/))
    tableBody.innerHTML = ''

    rows.forEach(row => {
        const tableRow = document.createElement('tr')
        row.forEach(cell => {
            const tableCell = document.createElement('td')
            tableCell.textContent = cell.replace(/"/g, '').trim()
            tableRow.appendChild(tableCell)
        })
        tableBody.appendChild(tableRow)
    })
}

// Init Editor.js
const editorInstruction = new EditorJS({
    holder: 'editor-instruction',
    placeholder: 'Write instruction...',
})

const editorOutput = new EditorJS({
    holder: 'editor-output',
    placeholder: 'Write an output... Select the desired text fragment and mark it with the appropriate label by right-clicking',
    tools: {
        header: {
            class: Header,
            inlineToolbar: true
        },
        paragraph: {
            class: Paragraph,
            inlineToolbar: true
        },
        list: {
            class: List,
            inlineToolbar: true
        },
    }
})

document.querySelector('.create_next_data').addEventListener('click', async function () {
    try {
        const instructionData = await editorInstruction.save()
        const outputData = await editorOutput.save()

        const instruction = instructionData.blocks.map(block => block.data.text ? block.data.text.trim() : '').join(' ')
        const output = formatBlocks(outputData.blocks)

        if (instruction && output !== '') {
            const newRow = document.createElement('tr')
            newRow.classList.add('new-row')

            const instructionCell = document.createElement('td')
            const outputCell = document.createElement('td')

            instructionCell.textContent = instruction
            outputCell.innerHTML = output

            newRow.appendChild(instructionCell)
            newRow.appendChild(outputCell)
            tableBody.appendChild(newRow)

            saveNewRowsToLocalStorage()

            editorInstruction.clear()
            editorOutput.clear()
        } else {
            alert('Fill in the fields "Instruction" и "Output"')
        }
    } catch (error) {
        handleErrors('Error when creating new data', error)
    }
})

function formatBlocks(blocks) {
    let content = []

    blocks.forEach(block => {
        if (block.type === 'header') {
            let text = block.data.text ? block.data.text.trim() : ''
            content.push(`/h ${text}`)
        } else if (block.type === 'paragraph') {
            let text = block.data.text ? formatInlineStyles(block.data.text).trim() : ''
            content.push(`/p ${text}`)
        } else if (block.type === 'list') {
            block.data.items.forEach((item, index) => {
                let listItem = item ? formatInlineStyles(item.trim()) : ''
                content.push(`/l${index + 1} ${listItem}`)
            })
        } else {
            let text = block.data.text ? formatInlineStyles(block.data.text).trim() : ''
            content.push(text)
        }
    })

    const uniqueContent = [...new Set(content)]
    return uniqueContent.join(' ').replace(/\s+/g, ' ').trim()
}

function formatInlineStyles(text) {
    text = text.replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')

    text = text.replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')

    text = text.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')

    return text
}




document.querySelector('.button_save_file').addEventListener('click', function() {
    saveDataToFile()
})

function saveDataToFile() {
    let csvContent = ''
    const rows = tableBody.querySelectorAll('tr')
    
    rows.forEach((row, index) => {
        let rowData = new Set()
        
        row.querySelectorAll('td').forEach(cell => {
            const content = formatContentForCSV(cell)
            rowData.add('"' + content.replace(/"/g, '""') + '"')
        })
        
        csvContent += Array.from(rowData).join(",") + (index < rows.length - 1 ? "\n" : "")
    })

    if (selectedFile) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", selectedFile.name)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => {
            URL.revokeObjectURL(url)
        }, 1000)
    } else {
        alert("File not found!")
    }
}

function formatContentForCSV(cell) {
    let content = new Set()  // Используем Set для автоматического удаления дубликатов

    // Проверяем каждый узел в ячейке
    cell.childNodes.forEach(node => {
        let text = node.textContent.trim()

        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            if (/\/[ph]\s/.test(text)) {
                content.add(text)  // Добавляем текст без изменений, если спецсимвол уже присутствует
            } else if (node.classList && node.classList.contains('header')) {
                content.add(`/h ${text}`)
            } else if (node.classList && node.classList.contains('paragraph')) {
                content.add(`/p ${text}`)
            } else if (node.classList && node.classList.contains('list')) {
                content.add(`/l ${text}`)
            } else {
                content.add(`/p ${text}`)
            }
        }
    })

    return Array.from(content).join(' ').replace(/\s+/g, ' ').trim()
}




/* Checking the TEXTFIELD for characters in it */
const textFields = document.querySelectorAll('.textfield')
textFields.forEach(field => {
    field.addEventListener('input', () => {
        if (field.textContent.trim() !== '') {
            field.classList.add('has-content')
        } else {
            field.classList.remove('has-content')
        }
    })
})




document.querySelector('.show_new_data').addEventListener('click', function() {
    const allRows = tableBody.querySelectorAll('tr')
    
    allRows.forEach(row => {
        if (!row.classList.contains('new-row')) {
            row.style.display = 'none'
        }
    })
})

document.querySelector('.show_all_data').addEventListener('click', function() {
    const allRows = tableBody.querySelectorAll('tr')
    
    allRows.forEach(row => {
        row.style.display = ''
    })
})




function saveNewRowsToLocalStorage() {
    try {
        let newRowsData = []
        const newRows = tableBody.querySelectorAll('tr.new-row')

        newRows.forEach(row => {
            let rowData = []
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent.trim())
            })
            newRowsData.push(rowData)
        })

        localStorage.setItem('newTableData', JSON.stringify(newRowsData))
    } catch (error) {
        handleErrors('Error saving data to localStorage', error)
    }
}

function loadNewRowsFromLocalStorage() {
    try {
        const savedNewData = localStorage.getItem('newTableData')
        if (savedNewData) {
            const newRowsData = JSON.parse(savedNewData)

            newRowsData.forEach(rowData => {
                const tableRow = document.createElement('tr')
                tableRow.classList.add('new-row')

                rowData.forEach(cellData => {
                    const tableCell = document.createElement('td')
                    tableCell.textContent = cellData
                    tableRow.appendChild(tableCell)
                })

                tableBody.appendChild(tableRow)
            })

            alert('The data has been successfully restored')
            
            // Запретить дальнейшие действия после восстановления
            disableFurtherActions()
        } else {
            alert('There is no saved data to restore')
        }
    } catch (error) {
        handleErrors('Error during data recovery', error)
    }
}

function disableFurtherActions() {
    const recoveryButton = document.querySelector('.recovery_data')
    recoveryButton.disabled = true
    recoveryButton.style.backgroundColor = '#ccc'
}




function handleErrors(message, error) {
    console.error(message, error)
    alert(`${message}: ${error.message}`)
    
    // Saving error info to local storage
    const errorLog = JSON.parse(localStorage.getItem('errorLog')) || []
    errorLog.push({ message, error: error.message, time: new Date().toISOString() })
    localStorage.setItem('errorLog', JSON.stringify(errorLog))
}




document.querySelector('.recovery_data').addEventListener('click', function() {
    loadNewRowsFromLocalStorage()
})