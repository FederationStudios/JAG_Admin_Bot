const { SlashCommandBuilder, Client, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Case = require('../../DBModels/Case');
const { encryptData } = require('../../utils/encryptionUtils'); 

module.exports = {
    name: 'add_case',
    description: 'Add a new case to the database',
    data: new SlashCommandBuilder()
        .setName('add_case')
        .setDescription('Adds a new case to the database.')
        .addStringOption(option =>
            option.setName('roblox_username')
                .setDescription('The Roblox username of the defendant.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('discord_username')
                .setDescription('The Discord username of the defendant.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('division')
            .setDescription('division which punished the user')
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
                    {name: 'Military Wide', value: 'Military Wide'}
            )
            .setRequired(true)   
        )        
        .addStringOption(option =>
            option.setName('prosecuting_authority')
                .setDescription('The division of the prosecuting authority.')
                .addChoices(
                    { name: 'Special Authority', value: 'Special Authority' },
                    { name: 'Commanding Officer', value: 'Commanding Officer' },
                    { name: 'High Command', value: 'High Command' },
                    { name: 'Military Police', value: 'Military Police' },
                    { name: 'Supreme Command', value: 'Supreme Command' }
                )
                .setRequired(true))
        .addStringOption(option =>
            option.setName('court_martial_type')
                .setDescription('The type of court martial.')
                .addChoices(
                    { name: 'General Court Martial', value: 'General Court Martial' },
                    { name: 'Special Court Martial', value: 'Special Court Martial' },
                    { name: 'Summary Court Martial', value: 'Summary Court Martial' },
                    { name: 'Appeal against a Summary Court Martial decision', value: 'Appeal against a Summary Court Martial decision'}
                )
                .setRequired(true))
        .addStringOption(option =>
            option.setName('case_status')
                .setDescription('The current status of the case.')
                .addChoices(
                    { name: 'Pending', value: 'Pending' },
                    { name: 'Denied', value: 'Denied' },
                    { name: 'Accepted', value: 'Accepted' },
                    { name: 'Awaiting Assignment of Judge', value: 'Awaiting Assignment of Judge' },
                    { name: 'Awaiting Approval from JAG Command', value: 'Awaiting Approval from JAG Command' },
                    { name: 'Case Ended', value: 'Case Ended' },
                    { name: 'Results Declared', value: 'Results Declared' }
                )
                .setRequired(true))
        .addStringOption(option =>
                option.setName('offenses_adjudicated')
                .setDescription('The offenses adjudicated.')
                .setRequired(true))        
        .addBooleanOption(option =>
            option.setName('judges_assigned')
                .setDescription('Whether judges have been assigned.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('judges_username')
                .setDescription('The usernames of the judges.')
                .setRequired(false)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        try {
            const robloxUsername = interaction.options.getString('roblox_username');
            const discordUsername = interaction.options.getString('discord_username');
            const division = interaction.options.getString('division');
            const prosecutingAuthority = interaction.options.getString('prosecuting_authority');
            const courtMartialType = interaction.options.getString('court_martial_type');
            const offensesAdjudicated = interaction.options.getString('offenses_adjudicated');
            const judgesAssigned = interaction.options.getBoolean('judges_assigned');
            const judgesUsername = interaction.options.getString('judges_username') || 'N/A';
            const caseStatus = interaction.options.getString('case_status');
            const submissionDate = new Date();

            // Generate case ID with court martial type prefix
            const caseCount = await Case.countDocuments() + 1;
            let caseIdPrefix;
            switch (courtMartialType) {
                case 'General Court Martial':
                    caseIdPrefix = 'GEN';
                    break;
                case 'Special Court Martial':
                    caseIdPrefix = 'SPE';
                    break;
                case 'Summary Court Martial':
                    caseIdPrefix = 'SUM';
                    break;
                case 'Appeal against a Summary Court Martial decision':
                    caseIdPrefix = 'AGCMD';
                    break;
                default:
                    caseIdPrefix = 'GEN';
                    break;
            }
            //For Division
            let divisionPrefix;
            switch (division) {
                case '3rd Guards Tanks':
                    divisionPrefix = '3GT';
                    break;
                case '98th Airborne Division':
                    divisionPrefix = '98TH';
                    break;
                case '1st Shock Infantry':
                        divisionPrefix = '1SI';
                        break;
                case 'Foreign Operations Department':
                        divisionPrefix = 'FOD';
                        break;
                case 'Imperial Special Operations Command':
                            divisionPrefix = 'ISOC';
                            break;
                case 'Imperial Guard':
                            divisionPrefix = 'IG';
                         break;
                case 'Military Police':
                            divisionPrefix = 'MP';
                         break;
                case 'Military Training Academy':
                            divisionPrefix = 'MTA';
                         break;
                case 'Quartermaster':
                            divisionPrefix = 'QA';
                         break;
                case 'Administrative & Community Services':
                            divisionPrefix = 'ACS';
                         break;                                               
                default:
                    divisionPrefix = 'Military Wide';
                    break;
            }

            // Encrypt usernames before saving
            const encryptedRobloxUsername = encryptData(robloxUsername);
            const encryptedDiscordUsername = encryptData(discordUsername);

            const caseId = `${caseIdPrefix}/${divisionPrefix}/${caseCount.toString().padStart(3, '0')}`;

            // Create an embed with case details
            const embed = new EmbedBuilder()
                .setTitle('New Case Submission')
                .setColor('Blue')
                .addFields(
                    { name: 'Case ID', value: caseId },
                    { name: 'Roblox Username', value: robloxUsername },
                    { name: 'Discord Username', value: discordUsername },
                    { name: 'Division', value: division },
                    { name: 'Prosecuting Authority', value: prosecutingAuthority },
                    { name: 'Court Martial Type', value: courtMartialType },
                    { name: 'Offenses Adjudicated', value: offensesAdjudicated },
                    { name: 'Judges Assigned', value: judgesAssigned ? 'Yes' : 'No' },
                    { name: 'Judges Username', value: judgesUsername },
                    { name: 'Case Status', value: caseStatus },
                    { name: 'Submission Date', value: submissionDate.toDateString() }
                );

            const approveButton = new ButtonBuilder()
                .setCustomId('approve_case')
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId('reject_case')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(approveButton, rejectButton);

            const channel = interaction.client.channels.cache.get('1265982268162183178'); // Replace with the correct channel ID
            const message = await channel.send({ embeds: [embed], components: [row] });

            //Role perms to approve or deny the add_case
            const requiredRoleIds = ['1008740665905131552', '964465282120830986'];

            const filter = i => ['approve_case', 'reject_case'].includes(i.customId);
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                //For role perms check
                const member = await i.guild.members.fetch(i.user.id);
                const hasRequiredRole = requiredRoleIds.some(roleId => member.roles.cache.has(roleId));
                if (!hasRequiredRole) {
                    await i.reply({ content: 'You do not have permission to approve or reject this case.', ephemeral: true });
                    return;
                }
                
                
                if (i.customId === 'approve_case') {
                    // Create a new case document
                    const newCase = new Case({
                        case_id: caseId,
                        roblox_username: encryptedRobloxUsername,
                        discord_username: encryptedDiscordUsername,
                        prosecuting_authority: prosecutingAuthority,
                        division: division,
                        court_martial_type: courtMartialType,
                        offenses_adjudicated: offensesAdjudicated,
                        judges_assigned: judgesAssigned,
                        judges_username: judgesUsername,
                        submit_date: submissionDate,
                        case_status: caseStatus
                    });

                    // Save the case to the database
                    await newCase.save();
                    await i.reply({ content: `Case ${caseId} has been successfully added to the database.`, ephemeral: true });
                } else if (i.customId === 'reject_case') {
                    await i.reply({ content: 'The case submission has been rejected.', ephemeral: true });
                }

                // Disable the buttons after decision
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        approveButton.setDisabled(true),
                        rejectButton.setDisabled(true)
                    );

                await message.edit({ components: [disabledRow] });
            });

            await interaction.reply({ content: 'Case submission is pending approval.', ephemeral: true });

        } catch (error) {
            console.error('Error adding case to database:', error);
            await interaction.reply({ content: 'There was an error submitting the case.', ephemeral: true });
        }
    }
};