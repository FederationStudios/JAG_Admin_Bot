const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, GuildMember } = require('discord.js');

module.exports = {
    name: 'withdraw',
    description: 'Withdraw a user from a specific role.',
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw the Prosecuting Authority role from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to withdraw the role from.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('division')
                .setDescription('The division the user belongs to.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reasoning')
                .setDescription('The reasoning for the withdrawal.')
                .setRequired(true)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async(client, interaction) => {

        await interaction.deferReply({ephemeral:true});

        try {
            const targetUser = interaction.options.getUser('user');
            const division = interaction.options.getString('division');
            const reasoning = interaction.options.getString('reasoning');
            const notifyUserId = '964465282120830986'; // Replace with the correct user or role ID

            const embed = new EmbedBuilder()
                .setTitle('Request to Withdraw Prosecuting Authority Role')
                .setColor('Red')
                .addFields(
                    { name: 'Target User', value: `${targetUser.tag}` },
                    { name: 'Division', value: division },
                    { name: 'Reasoning', value: reasoning },
                    { name: 'Requested by', value: `${interaction.user.tag}` }
                );

            const approveButton = new ButtonBuilder()
                .setCustomId('approve_withdrawal')
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId('reject_withdrawal')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(approveButton, rejectButton);

            const channel = interaction.client.channels.cache.get('960952766350639157'); // Replace with the correct channel ID

            // Correctly mention the user or role
            await channel.send(`<@&${notifyUserId}> someone has requested a withdrawal of roles.`);

            const message = await channel.send({ embeds: [embed], components: [row] });

            // Role that is allowed to approve or reject the withdrawal
            const requiredRoleName = 'JAG Command'; // Replace with the correct role name

            const filter = i => ['approve_withdrawal', 'reject_withdrawal'].includes(i.customId);
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const member = await i.guild.members.fetch(i.user.id);

                // Check if the user has the required role
                const hasRequiredRole = member.roles.cache.some(role => role.name === requiredRoleName);

                if (!hasRequiredRole) {
                    await i.reply({ content: 'You do not have permission to approve or reject this withdrawal.', ephemeral: true });
                    return;
                }

                if (i.customId === 'approve_withdrawal') {
                    const role = interaction.guild.roles.cache.find(role => role.name === 'Prosecuting Authority');
                    const targetMember = await interaction.guild.members.fetch(targetUser.id);

                    if (role && targetMember) {
                        await targetMember.roles.remove(role);
                        await i.reply({ content: `The role "Prosecuting Authority" has been withdrawn from ${targetUser.tag}.`, ephemeral: true });
                    } else {
                        await i.reply({ content: 'Error: Role or user not found.', ephemeral: true });
                    }
                } else if (i.customId === 'reject_withdrawal') {
                    await i.reply({ content: 'Withdrawal request has been rejected.', ephemeral: true });
                }

                // Remove the buttons after the decision
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        approveButton.setDisabled(true),
                        rejectButton.setDisabled(true)
                    );

                await message.edit({ components: [disabledRow] });
            });

            await interaction.editReply({ content: 'Withdrawal request submitted.', ephemeral: true });

        } catch (error) {
            console.error('Error handling withdrawal:', error);
            await interaction.editReply({ content: 'There was an error while processing your withdrawal request.', ephemeral: true });
        }
    },
};
