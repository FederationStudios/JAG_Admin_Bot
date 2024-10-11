/* eslint-disable no-unused-vars */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const case_list = require('../../DBModels/Case');
const { interactionEmbed } = require("../../functions");
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: 'assign_judges',
    description: 'Assign judges to a case or update the existing assignment',
    data: new SlashCommandBuilder()
        .setName('assign_judges')
        .setDescription('Assign judges to a case or update the existing assignment')
        .addStringOption(option => 
            option.setName('case_id')
                .setDescription('The ID of the case to assign judges to')
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName('judges_assigned')
                .setDescription('Whether judges are assigned or not')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('judges_username')
                .setDescription('The username of the assigned judges (if any)')
                .setRequired(false)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} options
     */
    run: async(client, interaction, options) => {

        await interaction.deferReply({ephemeral:true});

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
        }

        const caseId = interaction.options.getString('case_id');
        const judgesAssigned = interaction.options.getBoolean('judges_assigned');
        const judgesUsername = interaction.options.getString('judges_username') || 'N/A';

        try {
            // Find the case and update its judges information
            const result = await case_list.findOneAndUpdate(
                { case_id: caseId },
                { 
                    $set: { 
                        case_status: 'Accepted',
                        judges_assigned: judgesAssigned,
                        judges_username: judgesAssigned ? judgesUsername : 'N/A'
                    }
                },
                { new: true } // Return the updated document
            );

            if (!result) {
                return interaction.reply({ content: `No case found with ID ${caseId}.`, ephemeral: true });
            }

            await interaction.editReply({ content: `The case with ID ${caseId} has been updated successfully.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'An error occurred while assigning judges to the case.', ephemeral: true });
        }
    }
};
