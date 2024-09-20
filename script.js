/* Cropping text for a file */
const selectFile = document.querySelector('.button_select_file');
const fileName = document.querySelector('.file_name');
const fileInput = document.getElementById('fileInput');
const fileContent = document.querySelector('.file_content');
const tableBody = document.querySelector('#csvTable tbody');
let selectedFile = null;

// Функция для обрезки имени файла
function truncateFileName(name, maxLength) {
    if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...';
    }
    return name;
}

// Выбор файла
selectFile.addEventListener('click', function () {
    fileInput.click();
});

fileInput.addEventListener('change', function (event) {
    selectedFile = event.target.files[0];
    if (selectedFile) {
        const truncatedFileName = truncateFileName(selectedFile.name, 15);
        fileName.textContent = truncatedFileName;

        // Чтение содержимого файла
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            parseCSV(content); // Парсим CSV содержимое
            fileContent.classList.add("active");
        };
        reader.readAsText(selectedFile); // Чтение файла как текст
    }
});

// Функция для парсинга CSV и заполнения таблицы
function parseCSV(csv) {
    const rows = csv.split('\n').map(row => row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)); // Парсим CSV строки
    tableBody.innerHTML = ''; // Очищаем старые данные таблицы

    rows.forEach(row => {
        const tableRow = document.createElement('tr');
        row.forEach(cell => {
            const tableCell = document.createElement('td');
            tableCell.textContent = cell.replace(/"/g, '').trim(); // Убираем кавычки и лишние пробелы
            tableRow.appendChild(tableCell);
        });
        tableBody.appendChild(tableRow);
    });
}

// Добавление новых данных в таблицу
document.querySelector('.button_save_file').addEventListener('click', function() {
    const instruction = document.querySelector('.textfield.textfield_instruction').textContent.trim();
    const answer = document.querySelector('.textfield.textfield_answer').textContent.trim();

    // Создаем новую строку в таблице
    const newRow = document.createElement('tr');
    const instructionCell = document.createElement('td');
    const answerCell = document.createElement('td');

    instructionCell.textContent = instruction;
    answerCell.textContent = answer;

    newRow.appendChild(instructionCell);
    newRow.appendChild(answerCell);
    tableBody.appendChild(newRow);

    // Подготовка данных для сохранения
    saveDataToFile();
});

function saveDataToFile() {
    let csvContent = "";
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        let rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push('"' + cell.textContent.replace(/"/g, '""') + '"'); // Обрамляем данные кавычками для CSV формата
        });
        csvContent += rowData.join(",") + (index < rows.length - 1 ? "\n" : ""); // Добавляем перенос строки, кроме последней строки
    });

    if (selectedFile) {
        // Создаём новый объект Blob с типом данных CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Создаем ссылку для скачивания файла
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", selectedFile.name);
        link.style.visibility = 'hidden';

        // Программно кликаем по ссылке, чтобы начать скачивание
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Чистим URL после скачивания
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    } else {
        alert("File not found!");
    }
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
    });
});