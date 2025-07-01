document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    // Function to add a new todo item
    const addTodo = () => {
        const todoText = todoInput.value.trim();

        if (todoText !== '') {
            const listItem = document.createElement('li');

            const todoSpan = document.createElement('span');
            todoSpan.textContent = todoText;
            todoSpan.addEventListener('click', () => {
                listItem.classList.toggle('completed');
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                todoList.removeChild(listItem);
            });

            listItem.appendChild(todoSpan);
            listItem.appendChild(deleteButton);
            todoList.appendChild(listItem);

            todoInput.value = ''; // Clear the input field
        }
    };

    // Event listener for the Add Todo button
    addTodoBtn.addEventListener('click', addTodo);

    // Event listener for pressing Enter key in the input field
    todoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTodo();
        }
    });
});