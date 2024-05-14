const express = require("express");
const Task = require("../modules/TaskSchema");
const Notification = require("../modules/Notification");
const UserSchema = require("../modules/UserSchema");
const multer = require("multer");
const app = express.Router();
const { Expo } = require("expo-server-sdk");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const expo = new Expo();
app.use(cors());
const upload = multer({
  dest: "uploads/audio",
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/audio");
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + Date.now() + extension);
    },
  }),
});

app.post("/tasks", upload.single("pdfFile"), async (req, res) => {
  try {
    const {
      owner,
      taskGroup,
      taskName,
      description,
      audioFile,
      people,
      startDate,
      endDate,
      reminder,
    } = req.body;
    // console.log("reqst body",req.body)
    // console.log("reqst pdf body",req.file)

    // console.log(req.body,"data")
    const ownerId = owner.id;
    const ownerName = owner.name;
    const ownerprofilePic = owner.profilePic;
    const pdfFile = req.file ? req.file.path : null;

    // console.log('pdf',req.file)
    const newTask = new Task({
      owner,
      taskGroup,
      taskName,
      description,
      audioFile,
      pdfFile,
      people,
      startDate,
      endDate,
      reminder,
      createdAt: new Date(),
    });

    let taskNew = await newTask.save();
   
    const taskId = taskNew._id;

    for (const assignedUser of people) {
      const { userId, name } = assignedUser;

      const newNotification = new Notification({
        // profilePic : ownerprofilePic,
        title: `${ownerName} assigning task to you`,
        description: `New task: ${taskName}`,
        status: "pending",
        userid: userId, 
        owner: {
          id: ownerId, 
          name: ownerName,
          profilePic: ownerprofilePic,
        },
        taskId: taskId,
        created: new Date(),
        action: true,
      });
      await newNotification.save();
    }

    const allTasks = await Task.find();
    res.status(201).json({ newTask });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/notifications/reply", async (req, res) => {
  try {
    const { userId, taskId, status, comment } = req.body;

    const user = await UserSchema.findById(userId);

    const task = await Task.findById(taskId);
    const taskName = task.taskName;
    const ownerId = task.owner.id;

    let description = `Task: ${taskName}`;
    if (comment) {
      description += `\nComment: ${comment}`;
    }

    let title;
    switch (status) {
      case "Accepted":
        title = `${user.name} accepted the task`;
        break;
      case "Rejected":
        title = `${user.name} rejected the task`;
        break;
      case "Accepted & Modified":
        title = `${user.name} accepted and  modified the task`;
        break;
      default:
        title = `${user.name} responded to the task`; 
    }

    const newNotification = new Notification({
      title: title,
      description: description,
      status: status,
      userid: ownerId,
      owner: user.name,
      taskId: taskId,
      created: new Date(),
    });

    await newNotification.save();
    res
      .status(201)
      .json({ message: "Reply sent successfully", comment: comment });
  } catch (error) {
    console.error("Error replying to task notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/notifications/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const userNotifications = await Notification.find({ userid: userId });

    res.json(userNotifications);
  } catch (error) {
    console.error("Error retrieving user notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/tasks/update/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
    if (!task) {
      return res.status(404).send({ message: "Task not found" });
    }

    res.status(200).send(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/notifications/:taskid", async (req, res) => {
  const { id } = req.params; 
  const { title, description, status, owner, taskId } = req.body; 
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          status,
          owner,
          taskId,
        },
      },
      { new: true } 
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/action/update/:userid", async (req, res) => {
  try {
    const { userid } = req.params; 
    console.log('id', userid);
    const updatedNotifications = await Notification.updateMany(
      { userid: userid },
      { $set: { action: false } }
    );
    if (updatedNotifications.nModified === 0) {
      return res.status(404).json({ error: 'No notifications found for this user' });
    }
    res.json({ message: 'Notifications updated successfully' });
  } catch (error) {
 
    console.error("Error updating notifications:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// app.put('/updatetasks/:id', async (req, res) => {
//   const { id } = req.params;
//   const { startDate, endDate, reminder, comment } = req.body;

//   try {
//     const updatedTask = await Task.findByIdAndUpdate(id, {
//       $set: {
//         startDate,
//         endDate,
//         reminder,
//         comment
//       }
//     }, { new: true }); // { new: true } option returns the document after update

//     if (!updatedTask) {
//       return res.status(404).send('Task not found');
//     }

//     res.send(updatedTask);
//   } catch (error) {
//     res.status(400).send('Error updating task: ' + error.message);
//   }
// });

module.exports = app;
