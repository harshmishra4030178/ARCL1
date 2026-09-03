import Contact from "../../models/contactModel.js";

// CREATE CONTACT MESSAGE

export const createContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);

    res.status(201).json({
      success: true,

      message: "Message sent successfully",

      contact,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: "Failed to send message",
    });
  }
};

// GET ALL CONTACTS

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,

      contacts,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: "Failed to fetch contacts",
    });
  }
};

// GET SINGLE CONTACT

export const getSingleContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,

        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,

      contact,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: "Failed to fetch contact",
    });
  }
};

// UPDATE STATUS

export const updateContactStatus = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,

      {
        status: req.body.status,
      },

      {
        new: true,
      },
    );

    if (!contact) {
      return res.status(404).json({
        success: false,

        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,

      message: "Status updated successfully",

      contact,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: "Failed to update status",
    });
  }
};

// DELETE CONTACT

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,

        message: "Contact not found",
      });
    }

    res.status(200).json({
      success: true,

      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message: "Failed to delete contact",
    });
  }
};
