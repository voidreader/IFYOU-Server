import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({

    titleImageURL: {
        type: String
    },

    title: {
        type: String,
        required: "Title is required",
        index: true
    },

    ownership: {
        type: String,
        default: "PIER"
    },

    storyType: { // 스토리타입 : 
        type: String,
        default: "vertical"
    },

    defaultLang: {
        type: String,
        default: "KO"
    },

    supportLang: [{
        type: String,
        default: "KO"
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },

});

const model = mongoose.model("Story", StorySchema);
export default model;
