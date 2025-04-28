const { SlashCommandBuilder, Client, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const Case = require('../../DBModels/Case'); 
const { interactionEmbed } = require("../../functions");
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: "edit_case",
    description: "Edit details of a case.",
    data: new SlashCommandBuilder()
        .setName("edit_case")
        .setDescription("Edit details of a case.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("division")
                .setDescription("Edit the division for a case.")
                .addStringOption(option => option
                    .setName("case_id")
                    .setDescription("The ID of the case to edit.")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("new_division")
                    .setDescription("The new division.")
                    .setRequired(true)
                    .addChoices(
                        { name: '3rd Guards Tanks', value: '3rd Guards Tanks' },
                        { name: '98th Airborne Division', value: '98th Airborne Division' },
                        { name: '1st Shock Infantry', value: '1st Shock Infantry' },
                        { name: 'Foreign Operations Department', value: 'Foreign Operations Department' },
                        { name: 'Imperial Special Operations Command', value: 'Imperial Special Operations Command' },
                        { name: 'Imperial Guard', value: 'Imperial Guard' },
                        { name: 'Military Police', value: 'Military Police' },
                        { name: 'Military Training Academy', value: 'Military Training Academy' },
                        { name: 'Quartermaster', value: 'Quartermaster' },
                        { name: 'Administrative & Community Services', value: 'Administrative & Community Services' },
                        { name: 'Military Wide', value: 'Military Wide' }
                    )))

        .addSubcommand(subcommand =>
            subcommand
                .setName("prosecuting_authority")
                .setDescription("Edit the prosecuting authority for a case.")
                .addStringOption(option => option
                    .setName("case_id")
                    .setDescription("The ID of the case to edit.")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("new_prosecuting_authority")
                    .setDescription("The new prosecuting authority.")
                    .setRequired(true)
                    .addChoices(
                        { name: 'Special Authority', value: 'Special Authority' },
                        { name: 'Commanding Officer', value: 'Commanding Officer' },
                        { name: 'Military Police', value: 'Military Police' },
                        { name: 'High Command', value: 'High Command' },
                        { name: 'Supreme Command', value: 'Supreme Command' }
                    )))

        .addSubcommand(subcommand =>
            subcommand
                .setName("appeal_type")
                .setDescription("Edit the appeal type for a case.") // UPDATED here
                .addStringOption(option => option
                    .setName("case_id")
                    .setDescription("The ID of the case to edit.")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("new_appeal_type")
                    .setDescription("The new appeal type.")
                    .setRequired(true)
                    .addChoices(
                        { name: 'Summary Appeal Court', value: 'Summary Appeal Court' },
                        { name: 'General Appeal Court', value: 'General Appeal Court' },
                        { name: 'Appeal Tribunal', value: 'Appeal Tribunal' }
                    )))

        .addSubcommand(subcommand =>
            subcommand
                .setName("offenses_adjudicated")
                .setDescription("Edit the offenses adjudicated for a case.")
                .addStringOption(option => option
                    .setName("case_id")
                    .setDescription("The ID of the case to edit.")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("new_offenses_adjudicated")
                    .setDescription("The new offenses adjudicated.")
                    .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName("case_status")
                .setDescription("Edit the case status.")
                .addStringOption(option => option
                    .setName("case_id")
                    .setDescription("The ID of the case to edit.")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("new_case_status")
                    .setDescription("The new case status.")
                    .setRequired(true)
                    .addChoices(
                        { name: 'Pending', value: 'Pending' },
                        { name: 'Denied', value: 'Denied' },
                        { name: 'Accepted', value: 'Accepted' },
                        { name: 'Awaiting Assignment of Judge', value: 'Awaiting Assignment of Judge' },
                        { name: 'Awaiting Approval from JAG Command', value: 'Awaiting Approval from JAG Command' },
                        { name: 'Case Ended', value: 'Case Ended' },
                        { name: 'Results Declared', value: 'Results Declared' }
                    ))),

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} options
     */
    run: async (client, interaction, options) => {
        await interaction.deferReply({ ephemeral: true });

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", '', interaction, client, [true, 30]);
        }

        const subcommand = options.getSubcommand();
        const caseId = options.getString("case_id");
        let updateData = {};

        if (subcommand === "division") {
            updateData.division = options.getString("new_division");
        } else if (subcommand === "prosecuting_authority") {
            updateData.prosecuting_authority = options.getString("new_prosecuting_authority");
        } else if (subcommand === "appeal_type") {
            updateData.appeal_type = options.getString("new_appeal_type"); // UPDATED here
        } else if (subcommand === "offenses_adjudicated") {
            updateData.offenses_adjudicated = options.getString("new_offenses_adjudicated");
        } else if (subcommand === "case_status") {
            updateData.case_status = options.getString("new_case_status");
        }

        try {
            const caseDocument = await Case.findOneAndUpdate(
                { case_id: caseId },
                updateData,
                { new: true }
            );

            if (caseDocument) {
                await interaction.editReply({ content: `✅ ${subcommand.replace('_', ' ')} updated successfully for case ID ${caseId}.`, ephemeral: true });
            } else {
                await interaction.editReply({ content: `❌ Case with ID ${caseId} not found.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `❌ An error occurred while updating the ${subcommand.replace('_', ' ')}.`, ephemeral: true });
        }
    }
};
