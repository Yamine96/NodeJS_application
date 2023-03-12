const express = require('express');
// Joi pour Valider le saisir du champs
const Joi = require('joi');
// FS pour Lire et ecrire dans le fichier JSON
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Fichier Json à utiliser
const FILE_NAME = 'Students.json';

app.use(express.json());

// API pour récupérer tous les étudiants
app.get('/api/students', (req, res) => {
    const students = readData();
    res.send(students);
    console.log(getLastId(students))
});

// API pour récupérer un étudiant spécifique
app.get('/api/students/:id', (req, res) => {
    const id = req.params.id;
    const students = readData();
    const student = students.find(s => s.id === parseInt(id));
    if (!student) {
        return res.status(404).send(`L'étudiant avec l'ID ${id} n'a pas été trouvé.`);
    }
    res.send(student);
});

// récupérer le derniere id dans le fichier JSON
const getLastId = (students) => {
    if(students.length){
    return students[students.length - 1].id
    }else return 0;
}

// API pour créer un nouvel étudiant
app.post('/api/students', (req, res) => {
    const schema = Joi.object({
        nom: Joi.string().required(),
        classe: Joi.string().required(),
        modules: Joi.array().items(
            Joi.object({
                module: Joi.string().required(),
                note: Joi.number().min(0).max(20).required()
            })
        ).required()
    });

    const result = schema.validate(req.body);
    if (result.error) {
        return res.status(400).send(result.error.details[0].message);
    }

    const students = readData();

    const id = getLastId(students) + 1 ;
    const moyenne = calculateAverage(req.body.modules);
    const newStudent = {
        id: id,
        nom: req.body.nom,
        classe: req.body.classe,
        modules: req.body.modules,
        moyenne: moyenne
    };
    students.push(newStudent);
    writeData(students);
    res.send(newStudent);
});

// API pour mettre à jour un étudiant existant
app.put('/api/students/:id', (req, res) => {
    const id = req.params.id;

    const schema = Joi.object({
        nom: Joi.string().required(),
        classe: Joi.string().required(),
        modules: Joi.array().items(
            Joi.object({
                module: Joi.string().required(),
                note: Joi.number().min(0).max(20).required()
            })
        ).required()
    });

    const result = schema.validate(req.body);
    if (result.error) {
        return res.status(400).send(result.error.details[0].message);
    }

    const students = readData();
    const studentIndex = students.findIndex(s => s.id === parseInt(id));
    if (studentIndex === -1) {
        return res.status(404).send(`L'étudiant avec l'ID ${id} n'a pas été trouvé.`);
    }
    const moyenne = calculateAverage(req.body.modules);
    const updatedStudent = {
        id: students[studentIndex].id,
        nom: req.body.nom,
        classe: req.body.classe,
        modules: req.body.modules,
        moyenne: moyenne
    };
    students[studentIndex] = updatedStudent;
    writeData(students);
    res.send(updatedStudent);
});

// API pour supprimer un étudiant existant
app.delete('/api/students/:id', (req, res) => {
    const id = req.params.id;
    const students = readData();
    const studentIndex = students.findIndex(s => s.id === parseInt(id));
    if (studentIndex === -1) {
        return res.status(404).send(`L'étudiant avec l'ID ${id} n'a pas été trouvé.`);
    }
    students.splice(studentIndex, 1);
    writeData(students);
    res.send(`L'étudiant avec l'ID ${id} a été supprimé.`);
});

// Fonction pour lire les données du fichier JSON
function readData() {
    try {
        const data = fs.readFileSync(FILE_NAME);
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Fonction pour écrire les données dans le fichier JSON
function writeData(data) {
    fs.writeFileSync(FILE_NAME, JSON.stringify(data));
}

// Fonction pour calculer la moyenne des notes des modules
function calculateAverage(modules) {
    const sum = modules.reduce((acc, curr) => acc + Number(curr.note), 0);
    return sum / modules.length;
}
// Fonction pour afficher chaque étudiant avec leur meilleure et leur moindre  module 
app.get('/students/best-worst-modules', (req, res) => {
    const students = readData();
    const result = students.map(student => {
        const bestModule = student.modules.reduce((prev, curr) => {
            return prev.note > curr.note ? prev : curr;
        });
        const worstModule = student.modules.reduce((prev, curr) => {
            return prev.note < curr.note ? prev : curr;
        });
        return {
            id: student.id,
            nom: student.nom,
            meilleurModule: bestModule.module,
            pireModule: worstModule.module
        };
    });
    res.send(result);
});

// Fonction pour afficher la moyenne de tous les étudiants.
app.get('/students/average', (req, res) => {
    const students = readData();
    const moyennes = students.flatMap(student => student.moyenne);
    const average = moyennes.reduce((acc, curr) => acc + Number(curr), 0) / moyennes.length;
    res.send(`La moyenne de tous les étudiants est : ${average}`);
});


// Démarrer le serveur
app.listen(PORT, () => console.log(`Le serveur est démarré sur le port ${PORT}...`));
