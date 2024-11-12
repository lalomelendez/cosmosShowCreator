const Show = require("../models/Show");
const User = require("../models/User");

// Crear un nuevo show
const createShow = async (req, res) => {
  try {
    const { startTime, duration, clients } = req.body;
    const show = new Show({ startTime, duration, clients, status: "creado" });
    const savedShow = await show.save();
    res.status(201).json(savedShow);
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message || "Error al crear el show" });
  }
};

// Obtener todos los shows
const getShows = async (req, res) => {
  try {
    const shows = await Show.find().populate("clients");
    res.status(200).json(shows);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error al obtener los shows" });
  }
};
//// Obtener  los shows que han sido creados, pero no reproducidos
const getAvailableShows = async (req, res) => {
  try {
    const shows = await Show.find({ status: "creado" }).populate("clients");
    res.status(200).json(shows);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener shows disponibles",
      error: error.message,
    });
  }
};

// Obtener shows por una fecha específica
const getShowsByDate = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Fecha requerida" });
  }

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const shows = await Show.find({
      startTime: { $gte: start, $lt: end },
    }).populate("clients");

    res.status(200).json(shows);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener shows por fecha",
      error: error.message,
    });
  }
};

// Obtener un show por ID
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate("clients");
    if (!show) return res.status(404).json({ message: "Show no encontrado" });
    res.status(200).json(show);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error al obtener el show" });
  }
};

// Actualizar un show con los usuarios asignados
const updateShow = async (req, res) => {
  try {
    const { clients } = req.body;
    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      { clients },
      { new: true }
    ).populate("clients");

    if (!updatedShow)
      return res.status(404).json({ message: "Show no encontrado" });

    res.status(200).json(updatedShow);
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message || "Error al actualizar el show" });
  }
};

// Eliminar un show
const deleteShow = async (req, res) => {
  try {
    const deletedShow = await Show.findByIdAndDelete(req.params.id);
    if (!deletedShow)
      return res.status(404).json({ message: "Show no encontrado" });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error al eliminar el show" });
  }
};

// controllers/showController.js

const updateShowStatus = async (req, res) => {
  const { id: showId } = req.params; // Ensure correct parameter naming here
  const { status } = req.body;

  console.log(`Intentando actualizar el estado de show ${showId} a ${status}`);

  try {
    const updatedShow = await Show.findByIdAndUpdate(
      showId,
      { status },
      { new: true }
    );

    if (!updatedShow) {
      console.log("Show no encontrado");
      return res.status(404).json({ message: "Show no encontrado" });
    }

    console.log(`Estado de show ${showId} actualizado a ${updatedShow.status}`);
    res.status(200).json(updatedShow);
  } catch (error) {
    console.error("Error al actualizar el estado del show:", error);
    res.status(500).json({
      message: error.message || "Error al actualizar el estado del show",
    });
  }
};

// Function to remove a user from a show and reset their status
const removeUserFromShow = async (req, res) => {
  const { id: showId, userId } = req.params;
  console.log("Attempting to remove user:", userId, "from show:", showId);

  try {
    const show = await Show.findByIdAndUpdate(
      showId,
      { $pull: { clients: userId } },
      { new: true }
    );

    if (!show) {
      console.log("Show not found");
      return res.status(404).json({ message: "Show not found" });
    }

    await User.findByIdAndUpdate(userId, { status: "en espera" });
    console.log("User removed and status reset");

    res
      .status(200)
      .json({ message: "User removed from show and status reset" });
  } catch (error) {
    console.error("Error in removeUserFromShow:", error);
    res.status(500).json({ message: "Error removing user from show", error });
  }
};

// Function to delete a show and reset the status of all assigned users
const deleteShowAndResetUsers = async (req, res) => {
  const { id: showId } = req.params;

  try {
    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Reset the status of all users assigned to the show
    await User.updateMany(
      { _id: { $in: show.clients } },
      { status: "en espera" }
    );

    // Delete the show
    await Show.findByIdAndDelete(showId);

    res.status(200).json({ message: "Show deleted and user statuses reset" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting show", error });
  }
};

// Exportar todas las funciones necesarias
module.exports = {
  createShow,
  getShows,
  getAvailableShows,
  getShowsByDate,
  getShowById,
  updateShow,
  deleteShow,
  updateShowStatus,
  removeUserFromShow, //nueva func
  deleteShowAndResetUsers, //nueva func
};
