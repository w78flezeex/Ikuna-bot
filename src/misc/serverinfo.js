const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ChannelType } = require('discord.js'); // Добавлено перечисление ChannelType
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Информация о сервере'),
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({ content: "Эта команда может быть использована только внутри сервера.", ephemeral: true });
      return;
    }

    const owner = await guild.fetchOwner();
    await guild.members.fetch();
    await guild.channels.fetch();  // Загрузка каналов для заполнения кэша

    const members = guild.members.cache;
    const totalMembers = members.size;
    const totalHumans = members.filter(member => !member.user.bot).size;
    const totalBots = members.filter(member => member.user.bot).size;

    const onlineMembers = members.filter(member => member.presence?.status === 'online').size;
    const idleMembers = members.filter(member => member.presence?.status === 'idle').size;
    const dndMembers = members.filter(member => member.presence?.status === 'dnd').size;
    const offlineMembers = totalMembers - (onlineMembers + idleMembers + dndMembers);

    const totalChannels = guild.channels.cache.size;
    const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size;
    const stageChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildStageVoice).size;
    const forumChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildForum).size;
    const newsChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildNews).size;

    const totalBoosts = guild.premiumSubscriptionCount;
    const totalEmojis = guild.emojis.cache.size;
    const totalStickers = guild.stickers.cache.size;

    const serverAvatarURL = guild.iconURL({ dynamic: true }) || '';

    const verificationLevels = {
      0: 'Отсутствует',
      1: 'Низкий',
      2: 'Средний',
      3: 'Высокий',
      4: 'Очень высокий'
    };
    const verificationLevelString = verificationLevels[guild.verificationLevel] || 'Неизвестно';

    const creationDate = guild.createdAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const ageInYears = Math.floor((Date.now() - guild.createdAt) / (1000 * 60 * 60 * 24 * 365));

    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setThumbnail(serverAvatarURL || `https://cdn.discordapp.com/avatars/1200794422397378600/a_5190075ab6ca7d43e74805c59023138d.gif?size=4096`)
      .setTitle(`Информация о сервере "${guild.name}"`)
      .addFields(
        { name: 'Участники', value: `👥 Всего: ${totalMembers}\n🧑 Людей: ${totalHumans}\n🤖 Ботов: ${totalBots}`, inline: true },
        { name: 'По статусам', value: `🟢 В сети: ${onlineMembers}\n🟡 Неактивен: ${idleMembers}\n🔴 Не беспокоить: ${dndMembers}\n⚫ Не в сети: ${offlineMembers}`, inline: true },
        { name: 'Каналы', value: `📚 Всего: ${totalChannels}\n📝 Текстовых: ${textChannels}\n🔊 Голосовых: ${voiceChannels}\n🎙️ Трибун: ${stageChannels}\n📢 Новостных: ${newsChannels}\n📁 Форумов: ${forumChannels}`, inline: true },
        { name: 'Бусты', value: `🚀 Количество бустов: ${totalBoosts}`, inline: true },
        { name: 'Эмодзи и стикеры', value: `😃 Эмодзи: ${totalEmojis}\n🖼️ Стикеры: ${totalStickers}`, inline: true },
        { name: 'Владелец', value: `<@${owner.id}>`, inline: true },
        { name: 'Уровень проверки', value: verificationLevelString, inline: true },
        { name: 'Дата создания', value: `${creationDate}\n${ageInYears} год(а) назад`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
