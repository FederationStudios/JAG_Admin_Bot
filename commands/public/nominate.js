const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, GuildMember } = require('discord.js');

module.exports = {
    name: 'nominate',
    description: 'Nominate a user for a specific role.',
    data: new SlashCommandBuilder()
        .setName('nominate')
        .setDescription('Nominate a user for the Prosecuting Authority role.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to nominate.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('division')
                .setDescription('The division the user belongs to.')
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
                ))
        .addStringOption(option =>
            option.setName('reasoning')
                .setDescription('The reasoning for the nomination.')
                .setRequired(true)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async(client, interaction) => {
        try {
            const nominatedUser = interaction.options.getUser('user');
            const division = interaction.options.getString('division');
            const reasoning = interaction.options.getString('reasoning');
            const notifyUserId = '964465282120830986'; // Replace with the correct user or role ID

            const embed = new EmbedBuilder()
                .setTitle('Nomination for Prosecuting Authority Role')
                .setColor('Blue')
                .addFields(
                    { name: 'Nominated User', value: `${nominatedUser.tag}` },
                    { name: 'Division', value: division },
                    { name: 'Reasoning', value: reasoning },
                    { name: 'Nominated by', value: `${interaction.user.tag}` }
                );

            const approveButton = new ButtonBuilder()
                .setCustomId('approve_nomination')
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId('reject_nomination')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(approveButton, rejectButton);

            const channel = interaction.client.channels.cache.get('960952766350639157'); // Replace with the correct channel ID

            // Correctly mention the user or role
            await channel.send(`<@${notifyUserId}> someone has requested nomination roles.`);

            const message = await channel.send({ embeds: [embed], components: [row] });

            // Role that is allowed to approve or reject the nomination
            const requiredRoleName = 'JAG Command'; // Replace with the correct role name

            const filter = i => ['approve_nomination', 'reject_nomination'].includes(i.customId);
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const member = await i.guild.members.fetch(i.user.id);

                // Check if the user has the required role
                const hasRequiredRole = member.roles.cache.some(role => role.name === requiredRoleName);

                if (!hasRequiredRole) {
                    await i.reply({ content: 'You do not have permission to approve or reject this nomination.', ephemeral: true });
                    return;
                }

                if (i.customId === 'approve_nomination') {
                    const role = interaction.guild.roles.cache.find(role => role.name === 'Prosecuting Authority');
                    const nominatedMember = await interaction.guild.members.fetch(nominatedUser.id);

                    if (role && nominatedMember) {
                        await nominatedMember.roles.add(role);
                        await i.reply({ content: `The role "Prosecuting Authority" has been assigned to ${nominatedUser.tag}.`, ephemeral: true });
                    } else {
                        await i.reply({ content: 'Error: Role or user not found.', ephemeral: true });
                    }
                } else if (i.customId === 'reject_nomination') {
                    await i.reply({ content: 'Nomination has been rejected.', ephemeral: true });
                }

                // Remove the buttons after the decision
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        approveButton.setDisabled(true),
                        rejectButton.setDisabled(true)
                    );

                await message.edit({ components: [disabledRow] });
            });

            await interaction.reply({ content: 'Nomination submitted.', ephemeral: true });

        } catch (error) {
            console.error('Error handling nomination:', error);
            await interaction.reply({ content: 'There was an error while processing your nomination.', ephemeral: true });
        }
    },
};
