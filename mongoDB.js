const { Schema, model } = require("mongoose");

const warnsSchema = Schema({
  warnID: String,
  user: String,
  reason: String,
  moderator: String,
  date: String,
  guildID: String
});

const autoModerationSchema = Schema({
  banlinks: { type: String, default: '.ru' },
  guildID: String,
  whitelistChannels: { type: [String], default: [] },
  mentionsStatus: { type: String, default: 'off' },
  badWordsStatus: { type: String, default: 'off' },
  linksStatus: { type: String, default: 'off' },
  banwords: String,
  automodStatus: { type: String, default: 'on' },
  whitelistChannelsStatus: { type: String, default: 'off' },
  whitelistusers: { type: String, default: 'off'},
  whitelistuserslist: { type: [String], default: []} //айди участников на которых не действует автомодерация
});

const giveawaysSchema = Schema(
  {
      messageId: String,
      channelId: String,
      guildId: String,
      startAt: Number,
      endAt: Number,
      ended: Boolean,
      winnerCount: Number,
      prize: String,
      messages: {
          giveaway: String,
          giveawayEnded: String,
          giveawayEndedButton: String,
          title: String,
          inviteToParticipate: String,
          drawing: String,
          dropMessage: String,
          winMessage: Schema.Types.Mixed,
          embedFooter: Schema.Types.Mixed,
          noWinner: String,
          winners: String,
          endedAt: String,
          hostedBy: String,
          participants: String
      },
      thumbnail: String,
      image: String,
      hostedBy: String,
      winnerIds: { type: [String], default: undefined },
      participants: { type: [String], default: undefined },
      botsCanWin: Boolean,
      embedColor: Schema.Types.Mixed,
      embedColorEnd: Schema.Types.Mixed,
      exemptPermissions: { type: [], default: undefined },
      exemptMembers: String,
      bonusEntries: String,
      extraData: Schema.Types.Mixed,
      lastChance: {
          enabled: Boolean,
          content: String,
          threshold: Number,
          embedColor: Schema.Types.Mixed
      },
      pauseOptions: {
          isPaused: Boolean,
          content: String,
          unPauseAfter: Number,
          embedColor: Schema.Types.Mixed,
          durationAfterPause: Number,
          infiniteDurationText: String
      },
      isDrop: Boolean,
      allowedMentions: {
          parse: { type: [String], default: undefined },
          users: { type: [String], default: undefined },
          roles: { type: [String], default: undefined }
      }
  },
  { id: false }
);

const purchaseSchema = Schema({
  userID: String,
  guildID: String,
  title: String,
  description: String,
  price: Number,
  quantity: Number,
  date: String,
});

const shopItemSchema = Schema({
  title: String,
  description: String,
  price: Number,
  quantity: { type: Number, default: 1 }
});

const shopSchema = Schema({
  guildID: String,
  items: [shopItemSchema],
});

const moneySchema = Schema({
  handBalance: { type: Number, default: 0 },
  bankBalance: { type: Number, default: 0 },
  userID: String,
  guildID: String,
  status: String,
  percentage: String,
  time: { type: Number, default: 300000 },
});

const economySettingsSchema = Schema({
  guildID: String,
  currencySymbol: String, // Меняем тип на String, так как символ валюты представляет собой одиночный символ
  minEarnings: Number, // Минимальный заработок и максимальный заработок теперь типа Number, а не массива
  maxEarnings: Number,
  minBonus: Number, // Минимальный бонус
  maxBonus: Number, // Максимальный бонус
  minMonthly: Number, // Минимальный ежемесячный заработок
  maxMonthly: Number, // Максимальный ежемесячный заработок
});

module.exports = {
  economy_settings: model("EconomySettings", economySettingsSchema),
  shop: model("Shop", shopSchema),
  purchase: model("Purchase", purchaseSchema),
  money: model("Money", moneySchema),
  giveaways: model("Giveaways", giveawaysSchema),
  warns: model("Warns", warnsSchema),
  autoModeration: model("AutoModeration", autoModerationSchema),
};
