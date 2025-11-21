// app.js

// Data stores in memory
let members = [];
let tasks = [];

// DOM elements
const memberForm = document.getElementById("memberForm");
const memberList = document.getElementById("memberList");
const searchInput = document.getElementById("searchInput");

const taskForm = document.getElementById("taskForm");
const taskMembersSelect = document.getElementById("taskMembers");
const taskList = document.getElementById("taskList");

// ------- Member Management --------
// Add / Edit members
memberForm.addEventListener("submit", e => {
    e.preventDefault();
    const nameInput = document.getElementById("memberName");
    const emailInput = document.getElementById("memberEmail");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name) return alert("Member name is required");

    // Check if updating existing member
    if (memberForm.dataset.editingId) {
        const editId = memberForm.dataset.editingId;
        const memberIndex = members.findIndex(m => m.id === editId);
        if (memberIndex !== -1) {
            members[memberIndex].name = name;
            members[memberIndex].email = email;
            delete memberForm.dataset.editingId;
            memberForm.querySelector("button[type=submit]").textContent = "Add Member";
        }
    } else {
        // Add new member
        members.push({
            id: generateId(),
            name,
            email,
        });
    }

    // Reset form
    nameInput.value = "";
    emailInput.value = "";

    // Refresh member list and task member options
    renderMembers();
    renderTaskMemberOptions();
});

// Render member list with search filter
searchInput.addEventListener("input", () => renderMembers(searchInput.value.trim().toLowerCase()));

function renderMembers(filter = "") {
    memberList.innerHTML = "";
    const filteredMembers = members.filter(m => m.name.toLowerCase().includes(filter) || (m.email || "").toLowerCase().includes(filter));
    if (filteredMembers.length === 0) {
        memberList.innerHTML = `<div class="list-group-item">No members found</div>`;
        return;
    }
    filteredMembers.forEach(member => {
        const memberElem = document.createElement("div");
        memberElem.className = "list-group-item d-flex justify-content-between align-items-center";
        memberElem.innerHTML = `
      <div>
        <strong>${member.name}</strong> <br/>
        <small>${member.email || ""}</small>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editMember('${member.id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${member.id}')">Delete</button>
      </div>
    `;
        memberList.appendChild(memberElem);
    });
}

window.editMember = (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    document.getElementById("memberName").value = member.name;
    document.getElementById("memberEmail").value = member.email;
    memberForm.dataset.editingId = id;
    memberForm.querySelector("button[type=submit]").textContent = "Update Member";
}

window.deleteMember = (id) => {
    if (!confirm("Are you sure to delete this member?")) return;
    members = members.filter(m => m.id !== id);

    // Also remove member from any assigned tasks
    tasks.forEach(task => {
        task.assignees = task.assignees.filter(aid => aid !== id);
    });

    renderMembers();
    renderTaskMemberOptions();
    renderTasks();
}

// ------- Task Management --------
// Populate members in task multi-select
function renderMembers(filter = "") {
    const tbody = document.getElementById("memberTableBody");
    tbody.innerHTML = "";
    const filteredMembers = members.filter(
        m =>
            m.name.toLowerCase().includes(filter) ||
            (m.email || "").toLowerCase().includes(filter)
    );
    if (filteredMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">No members found</td></tr>`;
        return;
    }
    filteredMembers.forEach(member => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap">${member.name}</td>
      <td class="px-4 py-3 whitespace-nowrap">${member.email || ''}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right">
        <button class="text-indigo-600 hover:text-indigo-900 font-semibold mr-3" onclick="editMember('${member.id}')">Edit</button>
        <button class="text-red-600 hover:text-red-900 font-semibold" onclick="deleteMember('${member.id}')">Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

// render task member options
function renderTaskMemberOptions() {
    const container = document.getElementById('multiSelectContainer');
    container.innerHTML = '';  // Clear

    members.forEach(member => {
        const id = member.id;
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer mb-1';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-checkbox h-5 w-5 text-indigo-600';
        checkbox.value = id;
        checkbox.id = 'member-' + id;

        const span = document.createElement('span');
        span.className = 'text-gray-700';
        span.textContent = member.name;

        label.appendChild(checkbox);
        label.appendChild(span);

        container.appendChild(label);
    });
}

// Add tasks
taskForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("taskName").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const status = document.getElementById("taskStatus").value;

    // Get all checked members
    const checkedMembers = Array.from(document.querySelectorAll('#multiSelectContainer input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!name) return alert("Task name is required");
    if (checkedMembers.length === 0) return alert("Please assign at least one member");
    if (!priority) return alert("Please select priority");
    if (!status) return alert("Please select status");

    tasks.push({
        id: generateId(),
        name,
        description,
        priority,
        status,
        assignees: checkedMembers,
        comments: [],
        commentsHidden: false,
    });

    taskForm.reset();
    renderTaskMemberOptions();  // Reset checkboxes
    renderTasks();
});

// Render task list
function renderTasks() {
    taskList.innerHTML = "";
    if (tasks.length === 0) {
        taskList.innerHTML = `<div class="p-4">No tasks assigned</div>`;
        return;
    }

    tasks.forEach(task => {
        const taskElem = document.createElement("div");
        taskElem.className = "p-4 mb-4 bg-gray-50 rounded shadow";

        // List assignees names
        const assignedNames = task.assignees
            .map(id => {
                const m = members.find(mem => mem.id === id);
                return m ? m.name : "Unknown";
            })
            .join(", ");

        // Show or hide comments section
        const commentsVisibility = task.commentsHidden ? "none" : "block";
        const toggleButtonText = task.commentsHidden ? "Show Comments" : "Hide Comments";

        taskElem.innerHTML = `
  <h3 class="text-2xl font-bold mb-3 text-indigo-700">${task.name}</h3>
  <p class="mb-4 text-gray-700 max-w-xl">${task.description || "-"}</p>
  <div class="flex flex-wrap gap-4 mb-4 text-sm font-medium">
    <span class="px-3 py-1 rounded-full bg-red-200 text-red-800 shadow inner-shadow">
      Priority: <strong>${task.priority}</strong>
    </span>
    <span class="px-3 py-1 rounded-full bg-blue-200 text-blue-800 shadow inner-shadow">
      Status: <strong>${task.status}</strong>
    </span>
    <span class="px-3 py-1 rounded-full bg-green-200 text-green-800 shadow inner-shadow">
      Assignees: <strong>${assignedNames}</strong>
    </span>
  </div>
  <button
    class="btn btn-sm btn-outline-indigo flex items-center gap-2 mb-3 hover:bg-indigo-100 transition"
    onclick="toggleComments('${task.id}')">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12v8m-3-4h6" />
    </svg>
    ${toggleButtonText}
  </button>
  <div id="comments-${task.id}" style="display: ${commentsVisibility};" class="bg-white rounded-lg p-4 border border-gray-300 shadow-md transition-shadow hover:shadow-lg">
  <!-- Comments list -->
  <div id="comments-list-${task.id}" class="mb-4 max-h-48 overflow-auto space-y-3 border-t border-b border-gray-200 pt-3 pb-3">
    <!-- Comments injected here -->
  </div>
  
  <!-- Add new comment input -->
  <div class="flex items-center space-x-3 mt-4">
    <input
      type="text"
      id="comment-input-${task.id}"
      placeholder="Write a comment..."
      class="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
    />
    <button
      class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200 shadow-md"
      onclick="addComment('${task.id}')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2z" />
      </svg>
      <span>Add Comment</span>
    </button>
  </div>
</div>
`;

        taskList.appendChild(taskElem);
        renderComments(task.id);
    });
}

// Toggle comment section visibility
window.toggleComments = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    task.commentsHidden = !task.commentsHidden;
    renderTasks();
};

// Render comments under task
function renderComments(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const commentsListElem = document.getElementById("comments-list-" + taskId);
    commentsListElem.innerHTML = "";
    task.comments.forEach(comment => {
        const commentElem = document.createElement("div");
        commentElem.className = "p-1 text-sm border-b";
        commentElem.textContent = comment;
        commentsListElem.appendChild(commentElem);
    });
}

// Add comment to a task
window.addComment = (taskId) => {
    const inputElem = document.getElementById("comment-input-" + taskId);
    const text = inputElem.value.trim();
    if (!text) return;
    const task = tasks.find(t => t.id === taskId);
    task.comments.push(text);
    inputElem.value = "";
    renderComments(taskId);
}

// Utility to generate random ID
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Initialization
renderMembers();
renderTaskMemberOptions();
renderTasks();
