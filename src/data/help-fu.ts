export interface HelpSection {
  id: string;
  title: string;
  body: string[];
}

export const FU_HELP_SECTIONS: readonly HelpSection[] = [
  {
    id: 'meaning',
    title: '什么是符',
    body: ['符是除番数之外衡量和牌形价值的单位。普通面子手从底符开始，按和牌方式、听牌形、面子与雀头追加符数。'],
  },
  {
    id: 'fixed',
    title: '固定符',
    body: ['七对子按 25 符处理。国士无双在本工具练习说明中也按固定 25 符提示；符数练习题不会生成七对子或国士。'],
  },
  {
    id: 'base',
    title: '底符、门清荣和与自摸',
    body: ['普通面子手底符 20 符。门前清荣和加 10 符。自摸通常加 2 符，但平和自摸仍为 20 符。'],
  },
  {
    id: 'wait',
    title: '听牌符',
    body: ['边张、嵌张、单骑各加 2 符。两面听不加符。'],
  },
  {
    id: 'mentsu',
    title: '面子符',
    body: ['中张明刻 2 符、暗刻 4 符；幺九明刻 4 符、暗刻 8 符。杠子按刻子的 4 倍计算。顺子不加符。'],
  },
  {
    id: 'pair',
    title: '雀头符',
    body: ['三元牌、场风牌、自风牌作雀头各加 2 符。连风牌雀头可按规则选项处理为 2 符或 4 符。'],
  },
  {
    id: 'rounding',
    title: '进位与跳符',
    body: ['普通面子手合计后向上取整到 10 符。因为取整导致点数跳到下一档，常被称为跳符。'],
  },
  {
    id: 'examples',
    title: '例子',
    body: ['门清荣和、边张听、役牌雀头：20 底符 + 10 门清荣和 + 2 边张 + 2 役牌雀头 = 34，取整为 40 符。'],
  },
];
