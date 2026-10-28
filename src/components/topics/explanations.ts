import type { ArticleKey } from './articles';

// Concise additions only; empty entries avoid repeating the main explanation.
// Section indexes stay aligned with plain-language.ts and maths.ts.
export const explanations: Record<ArticleKey, [string, string][]> = {
  "cosmology": [
    [
      "",
      ""
    ],
    [
      "Expansion continues while light is travelling. A distant object’s present distance therefore cannot be found simply by multiplying the speed of light by its travel time.",
      "光在途中传播时，宇宙也一直在变化。因此，遥远天体“现在有多远”，不能简单用光速乘旅行时间代替。"
    ],
    [
      "This “baby picture” does not show the first instant of the Universe, and its patches are not already formed galaxies. Their angular sizes and strengths carry clues about early density variations and gas motions.",
      "这张“宇宙婴儿照”并非诞生第一瞬间的照片，冷热斑点也不是已经成形的星系。斑点在天空上的大小与强弱，保存了早期密度起伏和气体运动的线索。"
    ],
    [
      "For example, if equal volumes contain 110 units of matter here and 100 on average, the density contrast is 0.1. Dark matter supplies much of the gravitational framework; gas gathers and cools within it to form stars and galaxies.",
      "例如，同样大小的空间平均装着 100 份物质，这里却有 110 份，那么密度反差就是 0.1。暗物质搭建了重要的引力骨架，气体在其中汇聚、冷却，逐渐形成恒星与星系。"
    ],
    [
      "Two maps can contain the same number of galaxies yet look very different: one nearly uniform, the other full of knots and filaments. These statistics reveal the arrangement that a simple count misses.",
      "两张星图可以有同样多的星系，一张近乎均匀，另一张却布满结点和纤维。这些统计量关心的，正是单纯数星系时会遗漏的排列方式。"
    ],
    [
      "Picture a box whose sides all double with cosmic expansion. Its volume grows eightfold, so the density of a fixed amount of matter falls to one eighth. This gives a concrete meaning to the a⁻³ factor.",
      "想象一个随宇宙膨胀的盒子：长、宽、高都变成两倍，体积就变成八倍。盒子里的物质总量不变，平均密度便降到八分之一，这就是 a⁻³ 的直观含义。"
    ],
    [
      "The ruler also has a line-of-sight direction. Its extent in redshift provides information about the expansion rate, complementing the distance inferred from its angular size.",
      "这把尺子还有沿视线方向的一面：测量它跨过多少红移，可以获得膨胀速率的信息，与天空中角尺度给出的距离信息相互补充。"
    ],
    [
      "Researchers save snapshots along the way. Comparing them reveals when filaments and halos assemble, rather than showing only the final pattern.",
      "研究者会保存演化途中的“快照”。把它们连起来比较，就能追踪纤维与暗晕怎样逐步形成，而不只看到最后的一幅图。"
    ]
  ],
  "dark-sector": [
    [
      "",
      ""
    ],
    [
      "In this simple model, an approximately constant orbital speed means that the enclosed mass keeps increasing with radius. Comparing that inferred mass with visible stars and gas reveals the missing contribution.",
      "在这个简单模型里，如果转速近似不变，半径以内的总质量就必须随半径继续增加。再与恒星和气体提供的质量对账，便能看出那一份缺口。"
    ],
    [
      "",
      ""
    ],
    [
      "",
      ""
    ],
    [
      "Negative pressure describes a contribution to the evolution of spacetime. It does not mean a local wind is pushing galaxies outwards.",
      "这里的负压强描述的是时空演化中的一项贡献，并不意味着有一阵向外吹的风在推动星系。"
    ],
    [
      "For example, changing the matter content and changing the expansion history can produce similar effects in one galaxy survey. CMB and supernova measurements help distinguish them by adding constraints from other directions.",
      "例如，改变物质含量与改变膨胀历史，可能在一次星系巡天中留下相似影响。CMB 和超新星从其他方向提供约束，便能帮助分清原因。"
    ],
    [
      "Black holes are dark too, but any proposed population must satisfy constraints on its abundance, distribution and lensing effects. Being difficult to see is only the starting point for a candidate.",
      "黑洞也很暗，但任何候选群体都需要满足总量、分布和透镜效应等约束。“看不见”只是候选者的起点，还要看它能否解释整组证据。"
    ],
    [
      "A small detector signal may also come from radioactive materials or cosmic rays. Shielding, calibration and comparisons of the recorded events help separate a possible new interaction from these backgrounds.",
      "探测器里的小信号也可能来自材料放射性或宇宙线。实验需要屏蔽、标定，并比较记录下来的事件特征，才能把可能的新相互作用与背景区分开。"
    ]
  ],
  "machine-learning": [
    [
      "The target need not be a category. It can also be a continuous quantity, such as temperature estimated from observations. Defining the input and the desired output is the first step in choosing a useful model.",
      "目标也可以是连续数值，例如根据观测数据估计温度。先弄清楚输入是什么、希望得到什么，才容易选择合适的模型。"
    ],
    [
      "Take inputs 2 and 3, weights 0.5 and −1, and a bias of 1. The weighted sum is −1; a ReLU activation turns it into zero. A network combines many such simple calculations.",
      "拿一个小单元试算：输入为 2 和 3，权重为 0.5 和 −1，偏置为 1，加权结果就是 −1。再经过 ReLU 激活函数，负数会变成 0。网络把许多这样的简单计算连接起来。"
    ],
    [
      "Training usually updates the parameters using small batches of examples. A falling training loss shows progress on those examples; performance on unseen data still needs a separate check.",
      "训练时通常把样本分成小批次，边看例子边更新参数。训练损失下降，说明模型更好地完成了眼前的练习；面对新数据的表现，还需要另行检查。"
    ],
    [
      "Even the mean and scale used to normalise inputs should be estimated from training data alone. Otherwise, information from the test set enters the preparation of the model before its final evaluation.",
      "连数据归一化所用的均值和尺度，也应当只从训练数据估计。否则，测试集的信息就会提前参与模型准备，让最后的评估失去独立性。"
    ],
    [
      "Accuracy and calibration answer different questions: whether a prediction is close to the answer, and whether its stated uncertainty is trustworthy. Checking both helps identify cases that need closer inspection.",
      "预测误差与不确定性校准回答两个问题：答案离真实值多近，以及给出的把握有多可信。把两者一起检查，才能找出更值得仔细查看的样本。"
    ],
    [
      "The idea of a learned surrogate also appears in my current dark-energy research. I use machine learning to accelerate the equivalent-parameter calculation needed to extend an existing cosmological emulator to more target models. One stage predicts the dark-energy parameter required for distance matching; the second predicts the amplitude correction. The existing emulator then evaluates the spectrum. The learned surrogate speeds up the mapping step rather than replacing the CSST emulator itself.",
      "“插值器替身”的思路，也和我目前的暗能量研究直接相关。我在这里刚好用到了机器学习的方法：为了让已有宇宙学插值器处理更多目标模型，先用两阶段模型快速预测等效参数——第一阶段处理距离匹配所需的暗能量参数，第二阶段处理振幅修正——再把结果交给已有插值器计算功率谱。这里学习的是拓展插值器所需的参数映射，加速的是原本反复积分和求根的步骤，CSST 插值器本身仍负责后续的功率谱预测。"
    ],
    [
      "",
      ""
    ],
    [
      "",
      ""
    ]
  ],
  "finance": [
    [
      "",
      ""
    ],
    [
      "A fall from 100 to 50 is a 50% loss; returning from 50 to 100 requires a 100% gain. The percentage uses a different starting value each time.",
      "从 100 跌到 50 是亏损 50%，从 50 回到 100 却需要上涨 100%。每次百分比使用的底数不同，这也是理解回撤时容易忽略的一点。"
    ],
    [
      "Several funds may hold the same companies. Looking through to those holdings helps reveal exposures that their different names conceal.",
      "几只基金可能重仓同一批公司。把持仓展开来看，才能发现不同名字背后重叠的风险。"
    ],
    [
      "At an assumed discount rate of 5%, a certain payment of 105 one year from now is worth 100 today. At 10%, it is worth about 95.45. Valuing a stock adds the uncertainty of payments stretching across many years.",
      "假设折现率为 5%，一年后确定收到的 105 元，今天的折现值就是 100 元；折现率改为 10%，则约为 95.45 元。股票的现金流还可能延伸多年，并带有不确定性，估值也就更依赖假设。"
    ],
    [
      "Checking whether each transaction follows the rules and agreeing on a shared history are different tasks. The first resembles checking individual receipts; the second decides which history enters the common ledger.",
      "检查每笔交易是否符合规则，与让网络认可同一段历史，是两个层次的任务。前者像核对单据，后者像确定哪些记录进入大家共同使用的账本。"
    ],
    [
      "An annual report describes an earlier year but is usable only after publication. Acting on it earlier borrows information from the future. Trying hundreds of rules creates another trap: some will fit the past well by chance.",
      "年报写的是上一年的经营情况，却要等公布后才能使用。回测如果提前采用这些数字，就相当于拿到了未来的答案。反复试几百条规则还有另一种陷阱：其中一些可能只是碰巧贴合历史。"
    ],
    [
      "If ten units are offered at 100 and another ten at 101, buying twenty immediately costs an average of 100.5 before fees. Market depth—the quantity available at each price—explains the gap between the first quote and the actual trade.",
      "例如，100 元处有 10 份卖单，101 元处还有 10 份。立刻买入 20 份，忽略手续费，平均成交价就是 100.5 元。各价位可交易的数量，也就是市场深度，解释了报价与成交之间的差别。"
    ],
    [
      "A correct blockchain record does not establish that a custodian is financially sound or that an issuer can honour redemptions. The ledger and the institutions around it need to be understood together.",
      "链上记录正确，并不代表托管机构经营良好，也不代表发行方能兑现赎回承诺。理解数字资产，还需要把账本之外的人与机构一起看进去。"
    ]
  ]
};
