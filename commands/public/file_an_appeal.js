const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const nbx = require('noblox.js');

module.exports = {
    name: 'file_an_appeal',
    description: 'File an appeal for different court martial cases.',
    data: new SlashCommandBuilder()
        .setName('file_an_appeal')
        .setDescription('File an appeal')
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Your Roblox username.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prosecuting_authority')
                .setDescription('Select the prosecuting authority')
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
            option.setName('court_martial_type')
                .setDescription('Select the court martial type')
                .setRequired(true)
                .addChoices(
                    { name: 'Summary Court Martial', value: 'Summary Court Martial' },
                    { name: 'General Court Martial', value: 'General Court Martial' },
                    { name: 'Special Court Martial', value: 'Special Court Martial' },
                    { name: 'Appeal against a Summary Court Martial decision', value: 'Appeal against a Summary Court Martial decision' },
                ))
        .addStringOption(option =>
            option.setName('offenses_adjudicated')
                .setDescription('Description of the offenses adjudicated')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('google_docs_link')
                .setDescription('Attach the link file')
                .setRequired(false)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} options
     */            
    run: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.channel.id !== "1266061997242585289") {
                return await interaction.editReply({ content: "This command can only be used in <#1266061997242585289>", ephemeral: true });
            }

            const subject = interaction.options.getString('subject');
            const prosecutingAuthority = interaction.options.getString('prosecuting_authority');
            const courtMartialType = interaction.options.getString('court_martial_type');
            const offensesAdjudicated = interaction.options.getString('offenses_adjudicated');
            const linkAttachment = interaction.options.getString('google_docs_link') || 'No link provided';

            let id;
            try {
                id = await nbx.getIdFromUsername(subject);
            } catch (error) {
                return interaction.editReply({ content: `Error: Unable to find user \`${subject}\` on Roblox.`, ephemeral: true });
            }
            
            const info = await nbx.getPlayerInfo(id);
            const avatar = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=720x720&format=Png&isCircular=false`)
                .then(r => r.json())
                .then(r => r.data[0].imageUrl);

            const embed = new EmbedBuilder()
                .setTitle('Appeal Filed')
                .setThumbnail(avatar)
                .setColor(Colors.Red)
                .addFields(
                    { name: 'Discord Tag', value: interaction.user.tag },
                    { name: 'Discord ID', value: interaction.user.id },
                    { name: 'Subject', value: `[${info.username}](https://www.roblox.com/users/${id}/profile)`, inline: false },
                    { name: 'Prosecuting Authority', value: prosecutingAuthority, inline: false },
                    { name: 'Court Martial Type', value: courtMartialType, inline: false },
                    { name: 'Offenses Adjudicated', value: offensesAdjudicated, inline: false },
                    { name: 'Google Link', value: `[Click Here](${linkAttachment})`, inline: false }
                )
                .setFooter({ text: `JAG - Secure Transmission | Filed at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`, iconURL: client.user.displayAvatarURL() });

            const forwardButton = new ButtonBuilder()
                .setCustomId('forward_to_mp')
                .setLabel('Forward to MP')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(forwardButton);

            const logChannel = interaction.client.channels.cache.get('1265982268162183178'); // Replace with the correct channel ID
            await logChannel.send({ embeds: [embed], components: [row] });
            await interaction.user.send({ embeds: [embed] });

            await interaction.editReply({ content: 'Your appeal has been filed and sent to the appropriate channels.' });

            // Button interaction handler
            const filter = i => i.customId === 'forward_to_mp' && i.user.id === interaction.user.id;
            const collector = logChannel.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timer for collector

            collector.on('collect', async i => {
                const mpChannel = interaction.client.channels.cache.get('1265982268162183178'); // Replace with the MP channel ID
                const mpRoleId = '964465282120830986'; // Replace with the correct role ID to ping

                if (mpChannel) {
                    await mpChannel.send({
                        content: `Hi, new case incoming <@&${mpRoleId}>!`,
                        embeds: [embed]
                    });

                    // Update the original message to make the button invisible
                    const updatedRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('forward_to_mp')
                                .setLabel('Forward to MP')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        );
                    await i.message.edit({ components: [updatedRow] });

                    await i.reply({ content: 'The appeal has been forwarded to the Military Police.', ephemeral: true });
                } else {
                    await i.reply({ content: 'Error: MP channel not found.', ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    logChannel.send({ content: 'The forward button was not used.' });
                }
            });

        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'There was an error while processing your request.', ephemeral: true });
            }
        }
    },
};
