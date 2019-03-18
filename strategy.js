var z = require('zero-fill')
  , n = require('numbro')
  , rsi = require('../../../lib/rsi')
  , ta_trix = require('../../../lib/ta_trix')
  , Phenotypes = require('../../../lib/phenotype')

module.exports = {
  name: 'trix_max',
  description: 'TRIX but trades are done at the peaks and valleys, not when it crosses the 0 line.',

  getOptions: function () {
//common
    this.option('period', 'period length eg 10m', String, '15m')
    this.option('period_length', 'period length eg 10m', String, '15m')
    this.option('min_periods', 'min. number of history periods', Number, 52)
//trix
    this.option('timeperiod', 'timeperiod for TRIX', Number, 9)
    this.option('up_trend_threshold', 'will not sell unless trix is above this number', Number, 0)  //old, not needed
    this.option('down_trend_threshold', 'will not buy unless trix is above this number', Number, 0) //old, not needed
    this.option('trix_drop', 'will sell when trix number drops this amount', Number, 0.0001)        //suggest leaving this as is
    this.option('trix_recover', 'will buy when trix number raises this amount', Number, 0.0001)     //suggest leaving this as is
    this.option('noise_level_pct', 'do not trade when trix is this % of last trix', Number, 0)      //original plan to prevent trades on minor fluctuations across 0
    this.option('rsi_buy_safety', 'do not buy when rsi is higher than this', Number, 49)
    this.option('rsi_sell_safety', 'do not sell when rsi is lower than this', Number, 51)
//rsi
    this.option('rsi_periods', 'number of periods for overbought RSI', Number, 14)
    this.option('oversold_rsi', 'buy when RSI reaches or drops below this value', Number, 9)
    this.option('overbought_rsi', 'sell when RSI reaches or goes above this value', Number, 99)
//trade options
    this.option('continue_buying', 'keep buying till empty', String, null)
    this.option('continue_selling', 'keep selling till empty', String, null)
  },

  calculate: function (s) {
    rsi(s, 'rsi', s.options.rsi_periods)
  },

  onPeriod: function (s, cb) {
    if (s.in_preroll) return cb()
//rsi
    if (typeof s.period.rsi === 'number') {
      if (s.period.rsi <= s.options.oversold_rsi) {
        s.signal = 'buy'
      }

      if (s.period.rsi >= s.options.overbought_rsi) {
        s.signal = 'sell'
      }
    }

//trix
    ta_trix(s, s.options.timeperiod).then(function(signal) {
      s.period['trix'] = signal
      if (s.period.trix && s.lookback[0] && s.lookback[0].trix) {
        s.period.trend_trix = s.period.trix >= 0 ? 'up' : 'down'
      }

      if ((s.period.trix * 100) >= s.options.up_trend_threshold) {
        if (s.trend !== 'up') {
          s.acted_on_trend = false
        }
          s.trend = 'up'
          s.trix_high = Math.max(s.period.trix, s.lookback[0].trix, s.lookback[1].trix)
            if (s.options.noise_level_pct != 0 && ((s.period.trix / s.lookback[0].trix) * 100 < s.options.noise_level_pct)) {
              s.signal = null
            } else if (s.trend === 'up' && s.period.trix <= s.trix_high - s.options.trix_drop && s.period.rsi > s.options.rsi_sell_safety) {
//              s.signal = !s.acted_on_trend ? 'sell' : s.options.continue_selling
//if you want to sell ONLY AFTER a buy happens, move the "//" to the line below
              s.signal = 'sell'
            } 
      }

      if ((s.period.trix * 100) <= (s.options.down_trend_threshold * -1)) {
        if (s.trend !== 'down') {
          s.acted_on_trend = false
        }
        s.trend = 'down'
        s.trix_low = Math.min(s.period.trix, s.lookback[0].trix, s.lookback[1].trix)
            if (s.options.noise_level_pct != 0 && ((s.period.trix / s.lookback[0].trix) * 100 < s.options.noise_level_pct)) {
              s.signal = null
            } else if (s.trend === 'down' && s.period.trix >= s.trix_low + s.options.trix_recover && s.period.rsi < s.options.rsi_buy_safety) {
//          s.signal = !s.acted_on_trend ? 'buy' : s.options.continue_selling
//if you want to buy ONLY AFTER a sell happens, move the "//" to the line below
          s.signal = 'buy'
          } 
      }

      cb()
    }).catch(function(error) {
      console.log(error)
      cb()
    })
  },

  onReport: function (s) {
    let cols = []

    if (typeof s.period.rsi === 'number') {
      var color = 'grey'
      if (s.period.rsi <= s.options.oversold_rsi) {
        color = 'red'
      } else if (s.period.rsi >= s.options.overbought_rsi) {
        color = 'green'
      }
      cols.push(z(4, n(s.period.rsi).format('0'), ' ')[color])
    }

    if (typeof s.period.trix === 'number') {
      var color = 'grey'
      if ((s.period.trix * 100) <= (s.options.down_trend_threshold * -1)) {
        color = 'red'
      } else if ((s.period.trix * 100) >= s.options.up_trend_threshold) {
        color = 'green'
      }
      cols.push(z(8, n((s.period.trix * 100)).format('0.0000'), ' ')[color])
    }

    return cols
  },

  phenotypes: {
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(1, 104),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),

    timeperiod: Phenotypes.Range(1, 60),
    up_trend_threshold: Phenotypes.Range(0, 60),
    down_trend_threshold: Phenotypes.Range(0, 60),
    trix_drop: Phenotypes.Range(0, 60),
    trix_recover: Phenotypes.Range(0, 60),
    overbought_rsi_periods: Phenotypes.Range(1, 50),
    overbought_rsi: Phenotypes.Range(20, 100)
  }
}
