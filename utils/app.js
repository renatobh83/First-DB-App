class BD {
  constructor(dbName) {
    this.dbName = dbName;
    if (!window.indexedDB) {
      window.alert(
        "Your browser doesn't support a stable version of IndexedDB. \
            Such and such feature will not be available."
      );
    }
  }

  createObjectStores = (request) => {
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore("Contacts", {
        autoIncrement: true,
      });

      store.createIndex("email", "email", {
        unique: true,
      });
      store.createIndex("name", "name", {
        unique: false,
      });
      store.createIndex("tel", "tel", {
        unique: false,
      });
    };
  };

  deleteIndexDb = () => {
    indexedDB.deleteDatabase(this.dbName);
  };
  insertContact = (contact) => {
    const request = indexedDB.open(this.dbName, 1);
    this.createObjectStores(request);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const txn = db.transaction("Contacts", "readwrite");

      const store = txn.objectStore("Contacts");
      const query = store.put(contact);
      query.onsuccess = () => {
        emailValue.value = "";
        nameValue.value = "";
        telValue.value = "";
      };
      query.onerror = () => {
        emailValue.value = "";
        alert("Contato já cadastrado");
      };
      txn.oncomplete = function () {
        db.close();
      };
    };
  };

  loadContacts = (value) => {
    const request = indexedDB.open(this.dbName, 1);
    this.createObjectStores(request);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const txn = db.transaction("Contacts", "readonly");
      const objectStore = txn.objectStore("Contacts");
      if (spanName) {
        contactDiv.innerHTML = " ";
      }
      objectStore.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        if (cursor) {
          let contact = cursor.value;
          if (!!value) {
            if (regexTelefone.test(value)) {
              if (contact.tel.includes(value)) {
                insertValuesInSpan(contact);
              }
            } else if (regexEmail.test(value)) {
              if (contact.email.includes(value)) {
                insertValuesInSpan(contact);
              }
            } else {
              if (contact.name.includes(value)) {
                insertValuesInSpan(contact);
              }
            }
          } else {
            insertValuesInSpan(contact);
          }
          cursor.continue();
        }
      };
      // close the database connection
      txn.oncomplete = function () {
        db.close();
      };
    };
  };
  deleteContact = (email) => {
    const request = indexedDB.open(this.dbName, 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const txn = db.transaction("Contacts", "readwrite");

      const store = txn.objectStore("Contacts");

      const index = store.index("email");
      const query = index.getKey(email);

      query.onsuccess = function (event) {
        const a = store.delete(event.target.result);
      };

      query.onerror = function (event) {
        console.log(event.target.errorCode);
      };

      txn.oncomplete = function () {
        db.close();
      };
    };
  };
}
const btnLoad = document.getElementById("loadDb");
const btnQuery = document.getElementById("queryDb");
const btnClear = document.getElementById("clearDb");
const emailValue = document.getElementById("email");
const nameValue = document.getElementById("name");
const telValue = document.getElementById("tel");
const inputSearch = document.getElementById("search");

const errorDiv = document.getElementById("error");
const contactDiv = document.getElementById("nodes");

const json = document.getElementById("json");

json.addEventListener("change", () => {
  var reader = new FileReader();
  const saveDb = new BD(DBNAME);
  reader.addEventListener("load", function () {
    var result = JSON.parse(reader.result); // Parse the result into an object
    for (contato of result) {
      saveDb.insertContact(contato);
    }
    loadDB();
  });

  reader.readAsText(json.files[0]); // Read the uploaded file
});

let spanName = null;

const regexEmail = /\S+@\S+\.\S+/;
const regexTelefone = /(\(?\d{2}\)?\s)?(\d{4,5}\-?\d{4})/;

const DBNAME = "ContactsDb";

const clearDB = () => {};
const deleteIndex = () => {
  new BD(DBNAME).deleteIndexDb();
  loadDB();
};

const loadDB = () => {
  new BD(DBNAME).loadContacts();
};
function onSubmit() {
  event.preventDefault();
  if (!!emailValue.value) {
    const data = {
      email: emailValue.value.toLowerCase(),
      name: nameValue.value.toLowerCase(),
      tel: telValue.value,
    };
    const saveDb = new BD(DBNAME);
    saveDb.insertContact(data);

    loadDB();
  }
}

function pesquisa() {
  event.preventDefault();
  if (!!inputSearch.value) {
    searchInDb();
  }
}

const buttons = [btnLoad, btnQuery];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    button.id === "loadDb"
      ? loadDB()
      : button.id === "clearDb"
      ? clearDB()
      : button.id === "queryDb"
      ? deleteIndex()
      : null;
  });
});

function searchInDb() {
  const name = inputSearch.value.toLowerCase();
  new BD(DBNAME).loadContacts(name);
}
function deleteContact() {
  const contactForDelete = event.target.id;
  new BD(DBNAME).deleteContact(contactForDelete);
  loadDB();
}
function insertValuesInSpan(value) {
  spanName = document.createElement("span");
  const spanEmail = document.createElement("span");
  const spanTel = document.createElement("span");
  const remove = document.createElement("span");
  spanName.textContent = value.name.toUpperCase();
  spanTel.textContent = value.tel;
  spanEmail.textContent = value.email;
  remove.innerHTML = `<i class="fas fa-trash-alt" id=${value.email} onclick="deleteContact()"></i>`;
  contactDiv.appendChild(spanName);
  contactDiv.appendChild(spanEmail);
  contactDiv.appendChild(spanTel);
  contactDiv.appendChild(remove);
}
