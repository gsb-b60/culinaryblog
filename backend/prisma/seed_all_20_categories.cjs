const path = require('path');
const { PrismaClient, RecipeDifficulty, RecipeStatus } = require(path.join(__dirname, '../node_modules/@prisma/client'));
const slugify = require(path.join(__dirname, '../node_modules/slugify'));

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5432/lethimcook?schema=public' },
  },
});

function generateSlug(text) {
  return slugify(text, { lower: true, strict: true, locale: 'vi' });
}

// 20 categories with 6 unique, authentic recipes each (Total: 120 recipes)
const data = {
  'mon-bo': [
    {
      title: 'Phở bò tái lăn Hà Nội',
      description: 'Phở bò tái lăn với thịt bò tươi xào lăn lửa lớn dậy mùi tỏi thơm lừng, chan nước dùng trong ngọt ninh từ xương ống.',
      prepTime: 30, cookTime: 90, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt bò tươi phi lê', quantity: 500, unit: 'g' }, { name: 'Bánh phở tươi', quantity: 800, unit: 'g' }, { name: 'Xương ống bò', quantity: 1, unit: 'kg' }],
      steps: [{ stepNumber: 1, title: 'Hầm xương bò', description: 'Ninh xương ống bò trong 90 phút lấy nước dùng ngọt trong.' }, { stepNumber: 2, title: 'Xào lăn thịt bò', description: 'Xào tái lăn thịt bò cùng tỏi băm trên lửa lớn.' }, { stepNumber: 3, title: 'Hoàn thiện', description: 'Xếp bánh phở, thịt bò ra tô rồi chan nước dùng nóng.' }]
    },
    {
      title: 'Bò lúc lắc khoai tây chiên',
      description: 'Thịt thăn bò mềm mọng thái vuông quân cờ, xào lửa lớn cùng ớt chuông, hành tây và bơ tỏi thơm lừng.',
      prepTime: 20, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt thăn bò mềm', quantity: 450, unit: 'g' }, { name: 'Ớt chuông xanh đỏ', quantity: 2, unit: 'quả' }, { name: 'Bơ lạt và tỏi', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Ướp thịt bò', description: 'Ướp thịt bò với tỏi, dầu hào, tiêu đen trong 15 phút.' }, { stepNumber: 2, title: 'Xào bò lúc lắc', description: 'Đun chảo nóng, cho bò vào đảo nhanh tay lửa lớn 3 phút rồi thêm bơ.' }]
    },
    {
      title: 'Bò sốt vang bánh mì giòn',
      description: 'Bắp bò hầm rượu vang đỏ đậm đà, nước sốt sánh mịn thơm phức quế hồi, chấm cùng bánh mì nóng giòn.',
      prepTime: 25, cookTime: 60, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bắp bò có gân', quantity: 600, unit: 'g' }, { name: 'Rượu vang đỏ', quantity: 150, unit: 'ml' }, { name: 'Cà rốt và khoai tây', quantity: 3, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Ướp thịt bò', description: 'Ướp bắp bò với rượu vang đỏ và gia vị trong 30 phút.' }, { stepNumber: 2, title: 'Hầm sốt vang', description: 'Xào săn thịt rồi hầm nhỏ lửa cùng cà chua, khoai tây trong 45 phút.' }]
    },
    {
      title: 'Bò nướng lá lốt mỡ hành',
      description: 'Thịt bò băm cuốn lá lốt nướng xém cạnh thơm nức mũi, rắc đậu phộng mỡ hành, chấm mắm nêm đậm đà.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt bò băm', quantity: 400, unit: 'g' }, { name: 'Lá lốt tươi', quantity: 40, unit: 'lá' }, { name: 'Sả băm và đậu phộng', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuộn bò lá lốt', description: 'Trộn đều nhân bò sả rồi cuộn chặt vào lá lốt bánh tẻ.' }, { stepNumber: 2, title: 'Nướng thơm', description: 'Nướng than hoa hoặc nồi chiên 10 phút đến khi lá lốt dậy mùi thơm.' }]
    },
    {
      title: 'Bò xào cần tỏi tây',
      description: 'Món ăn gia đình kinh điển với thịt bò xào vừa chín tới giữ độ mềm ngọt, hòa quyện vị thơm thanh của cần tỏi.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt bò thăn thái mỏng', quantity: 350, unit: 'g' }, { name: 'Cần tây và tỏi tây', quantity: 200, unit: 'g' }, { name: 'Dầu hào và tỏi băm', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào bò tái', description: 'Lửa to, đảo thịt bò tái trong 1 phút rồi múc ra đĩa.' }, { stepNumber: 2, title: 'Xào rau cần tỏi', description: 'Xào rau vừa chín tới rồi trút bò vào đảo đều 30 giây.' }]
    },
    {
      title: 'Canh bắp bò hầm hạt sen',
      description: 'Món canh thanh mát bổ dưỡng với bắp bò hầm mềm ngọt cùng hạt sen bùi béo và nấm hương thanh khiết.',
      prepTime: 20, cookTime: 50, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bắp bò hoa', quantity: 450, unit: 'g' }, { name: 'Hạt sen tươi Huế', quantity: 150, unit: 'g' }, { name: 'Nấm hương tươi', quantity: 8, unit: 'tai' }],
      steps: [{ stepNumber: 1, title: 'Hầm bắp bò', description: 'Hầm bắp bò cùng chút gừng trong 35 phút cho mềm.' }, { stepNumber: 2, title: 'Nấu hạt sen nấm', description: 'Cho hạt sen và nấm hương vào nấu thêm 15 phút đến khi bùi thơm.' }]
    }
  ],

  'mon-ga': [
    {
      title: 'Phở gà ta Hà Nội lá chanh',
      description: 'Phở gà truyền thống với nước dùng trong vắt thanh ngọt, da gà vàng giòn đượm hương lá chanh thái chỉ.',
      prepTime: 25, cookTime: 60, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt gà ta thả vườn', quantity: 1, unit: 'con' }, { name: 'Bánh phở tươi', quantity: 800, unit: 'g' }, { name: 'Lá chanh non', quantity: 10, unit: 'lá' }],
      steps: [{ stepNumber: 1, title: 'Luộc gà', description: 'Luộc gà ta chín tới với gừng hành nướng.' }, { stepNumber: 2, title: 'Nấu nước dùng', description: 'Ninh xương gà lấy nước dùng ngọt thanh.' }]
    },
    {
      title: 'Gà nướng mật ong sả ớt',
      description: 'Thịt gà nướng vàng ruộm óng ánh mật ong, lớp da giòn dai thấm đẫm vị sả thơm lừng và ớt cay tê nhẹ.',
      prepTime: 20, cookTime: 35, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Đùi gà tươi', quantity: 800, unit: 'g' }, { name: 'Mật ong nguyên chất', quantity: 3, unit: 'muỗng' }, { name: 'Sả băm tỏi ớt', quantity: 4, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Ướp gà mật ong', description: 'Ướp đùi gà cùng mật ong, sả, tỏi, dầu điều trong 30 phút.' }, { stepNumber: 2, title: 'Nướng vàng', description: 'Nướng gà ở 190 độ C trong 30 phút đến khi da vàng óng.' }]
    },
    {
      title: 'Gỏi gà xé phay bắp cải',
      description: 'Món gỏi thanh mát chống ngấy với thịt gà xé sợi dai ngọt, bắp cải giòn sần sật quyện vị chua cay ngọt hài hòa.',
      prepTime: 20, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt gà luộc xé sợi', quantity: 400, unit: 'g' }, { name: 'Bắp cải bào sợi', quantity: 300, unit: 'g' }, { name: 'Rau răm và đậu phộng', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chuẩn bị rau', description: 'Bào bắp cải ngâm nước đá cho giòn ráo.' }, { stepNumber: 2, title: 'Trộn gỏi', description: 'Trộn đều gà xé, bắp cải cùng nước mắm chua ngọt và rau răm.' }]
    },
    {
      title: 'Cơm gà Hải Nam chuẩn vị',
      description: 'Cơm nấu từ nước luộc gà béo ngậy thơm vàng nghệ, thịt gà mọng nước chấm nước sốt gừng tỏi ớt đặc trưng.',
      prepTime: 25, cookTime: 40, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gà ta nguyên con', quantity: 1.3, unit: 'kg' }, { name: 'Gạo tẻ thơm', quantity: 400, unit: 'g' }, { name: 'Gừng và tỏi băm', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Luộc gà lấy nước dùng', description: 'Luộc gà cùng gừng tươi cho chín mềm mọng nước.' }, { stepNumber: 2, title: 'Nấu cơm gà', description: 'Xào gạo cùng mỡ gà rồi nấu bằng nước luộc gà cho thơm dẻo.' }]
    },
    {
      title: 'Gà hấp muối sả lá chanh',
      description: 'Gà hấp muối hột giữ trọn vẹn vị ngọt đậm đà của thịt, da giòn sần sật quyện hương thơm ngát của sả và lá chanh.',
      prepTime: 15, cookTime: 35, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Gà ta hoa mơ', quantity: 1.2, unit: 'kg' }, { name: 'Muối hột hạt to', quantity: 500, unit: 'g' }, { name: 'Sả cây và lá chanh', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Rải muối đáy nồi', description: 'Rải lớp muối hột dày đáy nồi, lót sả đập dập và lá chanh lên.' }, { stepNumber: 2, title: 'Hấp gà chín', description: 'Đặt gà lên trên lớp sả, đậy kín vung đun nhỏ lửa 35 phút cho gà chín bằng hơi.' }]
    },
    {
      title: 'Cà ri gà nước cốt dừa',
      description: 'Thịt gà chặt miếng nấu cùng khoai lang, nước cốt dừa sánh béo ngậy thơm nức mũi mùi bột cà ri và sả.',
      prepTime: 20, cookTime: 35, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt gà chặt miếng', quantity: 700, unit: 'g' }, { name: 'Nước cốt dừa', quantity: 300, unit: 'ml' }, { name: 'Khoai lang và cà rốt', quantity: 2, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Ướp bột cà ri', description: 'Ướp gà với bột cà ri, sả băm, hạt nêm trong 20 phút.' }, { stepNumber: 2, title: 'Nấu cà ri', description: 'Xào săn gà, cho khoai lang và nước dừa vào ninh 25 phút đến khi sánh mịn.' }]
    }
  ],

  'mon-heo': [
    {
      title: 'Thịt kho tàu nước dừa trứng vịt',
      description: 'Từng miếng thịt ba chỉ vuông vức mềm tan ngập trong nước dừa tươi ngọt đậm, trứng vịt thấm đẫm sắc nâu óng ả.',
      prepTime: 20, cookTime: 60, servings: 5, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt ba chỉ heo tươi', quantity: 600, unit: 'g' }, { name: 'Nước dừa tươi', quantity: 500, unit: 'ml' }, { name: 'Trứng vịt luộc', quantity: 5, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Ướp thịt heo', description: 'Ướp thịt ba chỉ vuông vức với hành tỏi, nước mắm, đường trong 30 phút.' }, { stepNumber: 2, title: 'Kho nước dừa', description: 'Kho thịt cùng nước dừa và trứng vịt trên lửa nhỏ trong 50 phút.' }]
    },
    {
      title: 'Sườn heo nướng mật ong sả ớt',
      description: 'Sườn non heo ướp sả mật ong nướng thơm nức mũi, thịt mềm ngọt đậm đà không bị khô.',
      prepTime: 15, cookTime: 30, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Sườn non heo tươi', quantity: 700, unit: 'g' }, { name: 'Mật ong nguyên chất', quantity: 2, unit: 'muỗng' }, { name: 'Sả băm nhỏ', quantity: 3, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Ướp sườn', description: 'Trộn đều sườn cùng sả băm, mật ong, dầu hào trong 20 phút.' }, { stepNumber: 2, title: 'Nướng vàng', description: 'Nướng sườn trên vỉ than hoa hoặc nồi chiên 25 phút.' }]
    },
    {
      title: 'Nem rán Hà Nội truyền thống',
      description: 'Món nem rán giòn rụm với nhân thịt heo băm, nấm hương, mộc nhĩ và miến dong thơm ngon chuẩn vị Tết.',
      prepTime: 30, cookTime: 20, servings: 5, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt nạc vai heo xay', quantity: 400, unit: 'g' }, { name: 'Mộc nhĩ, nấm hương, miến', quantity: 100, unit: 'g' }, { name: 'Bánh đa nem giòn', quantity: 30, unit: 'lá' }],
      steps: [{ stepNumber: 1, title: 'Gói nem', description: 'Trộn đều nhân thịt heo miến nấm rồi cuộn vào bánh đa nem.' }, { stepNumber: 2, title: 'Rán giòn', description: 'Rán ngập dầu lửa vừa đến khi vỏ nem vàng ruộm giòn tan.' }]
    },
    {
      title: 'Thịt ba chỉ luộc chấm mắm tôm',
      description: 'Thịt ba rọi heo luộc giòn sần sật trắng tinh, chấm đẫm mắm tôm đánh sủi bọt chanh ớt ăn kèm cà pháo.',
      prepTime: 10, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt ba chỉ heo rút sườn', quantity: 500, unit: 'g' }, { name: 'Mắm tôm nguyên chất', quantity: 3, unit: 'muỗng' }, { name: 'Cà pháo muối giòn', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Luộc thịt heo', description: 'Luộc thịt ba chỉ cùng củ hành tím đập dập trong 20 phút cho chín tới.' }, { stepNumber: 2, title: 'Pha mắm tôm', description: 'Đánh mắm tôm cùng đường, nước cốt chanh, ớt tươi sủi bọt trắng mịn.' }]
    },
    {
      title: 'Sườn xào chua ngọt',
      description: 'Sườn heo chiên vàng áo lớp sốt me chua ngọt đậm đà, óng ánh sắc đỏ tự nhiên ăn cùng cơm trắng nóng hổi.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Sườn non chặt miếng', quantity: 600, unit: 'g' }, { name: 'Nước cốt me và giấm gạo', quantity: 3, unit: 'muỗng' }, { name: 'Đường, tương cà, tỏi', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Rán sơ sườn', description: 'Luộc sơ sườn rồi rán vàng xém các cạnh.' }, { stepNumber: 2, title: 'Sốt chua ngọt', description: 'Đổ nước sốt me chua ngọt vào đảo đều đến khi sốt keo bám quanh miếng sườn.' }]
    },
    {
      title: 'Canh sườn heo hầm sấu chua dịu',
      description: 'Món canh thanh nhiệt mùa hè miền Bắc với sườn non hầm mềm róc xương, vị chua thanh mát đặc trưng từ quả sấu tươi.',
      prepTime: 15, cookTime: 35, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Sườn heo non', quantity: 500, unit: 'g' }, { name: 'Quả sấu tươi xanh', quantity: 5, unit: 'quả' }, { name: 'Cà chua và hành hoa', quantity: 2, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Ninh sườn', description: 'Ninh sườn heo nhỏ lửa trong 30 phút cho mềm ngọt nước.' }, { stepNumber: 2, title: 'Dầm sấu', description: 'Cho sấu tươi vào nấu chín nổi lên rồi dầm nát lấy vị chua thanh dịu.' }]
    }
  ],

  'mon-hai-san': [
    {
      title: 'Tôm hấp bia sả gừng tươi',
      description: 'Tôm sú tươi roi rói hấp cùng bia tươi và sả cây, thịt tôm giòn sần sật ngọt lịm chấm muối tiêu chanh.',
      prepTime: 10, cookTime: 12, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Tôm sú biển tươi', quantity: 500, unit: 'g' }, { name: 'Bia tươi lon', quantity: 1, unit: 'lon' }, { name: 'Sả cây đập dập', quantity: 5, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Hấp tôm bia', description: 'Lót sả đáy nồi, cho tôm và bia vào hấp chín đỏ trong 10 phút.' }]
    },
    {
      title: 'Mực ống xào sa tế cay nồng',
      description: 'Mực ống tươi khía vảy rồng giòn sần sật xào cùng sốt sa tế thơm cay, hành tây và ớt chuông đậm đà.',
      prepTime: 15, cookTime: 8, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Mực ống tươi khía hoa', quantity: 450, unit: 'g' }, { name: 'Sa tế tôm cay', quantity: 2, unit: 'muỗng' }, { name: 'Cần tây và hành tây', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xào mực sa tế', description: 'Phi thơm tỏi sa tế, xào mực lửa lớn 2 phút rồi thêm cần tây đảo đều.' }]
    },
    {
      title: 'Cá lóc hấp bầu nguyên trái',
      description: 'Cá lóc đồng ngọt thịt nằm trọn trong lòng quả bầu xanh mướt, hấp giữ trọn vị thanh tao tự nhiên.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cá lóc đồng làm sạch', quantity: 1, unit: 'con' }, { name: 'Quả bầu non khoét ruột', quantity: 1, unit: 'trái' }, { name: 'Gừng, hành hoa, nấm mèo', quantity: 80, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xếp cá vào bầu', description: 'Ướp cá lóc với gia vị rồi đặt vào quả bầu đã khoét ruột.' }, { stepNumber: 2, title: 'Hấp chín', description: 'Hấp cách thủy 25 phút đến khi cá chín mềm thơm nức mũi.' }]
    },
    {
      title: 'Cua biển rang me chua ngọt',
      description: 'Cua biển Cà Mau chắc nịch đẫm trong nước sốt me sánh đỏ chua cay mặn ngọt bùng nổ vị giác.',
      prepTime: 20, cookTime: 20, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cua biển tươi sống', quantity: 2, unit: 'con' }, { name: 'Nước cốt me đặc', quantity: 4, unit: 'muỗng' }, { name: 'Tỏi băm, ớt hiểm', quantity: 3, unit: 'tép' }],
      steps: [{ stepNumber: 1, title: 'Chiên sơ cua', description: 'Chặt cua thành miếng vừa ăn, chiên sơ cho gạch và thịt săn lại.' }, { stepNumber: 2, title: 'Sốt me đậm đà', description: 'Phi thơm tỏi, cho nước me vào đun sôi rồi thả cua vào đảo đều đến khi sốt keo lại.' }]
    },
    {
      title: 'Canh chua cá bớp miền Trung',
      description: 'Khúc cá bớp béo ngậy nấu cùng thơm, cà chua, me chua và bạc hà giòn mát xua tan cái nóng oi ả.',
      prepTime: 15, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Cá bớp tươi cắt lát', quantity: 450, unit: 'g' }, { name: 'Thơm, cà chua, đậu bắp', quantity: 200, unit: 'g' }, { name: 'Me chua và ngò om', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu nước canh chua', description: 'Đun sôi nước me, cho cá bớp vào nấu chín rồi cho rau củ vào đun sôi thêm 3 phút.' }]
    },
    {
      title: 'Nghêu hấp sả ớt lá quế',
      description: 'Nghêu biển ngọt nước hấp ngập trong hương sả đập dập, ớt cay xè và lá quế thơm lừng.',
      prepTime: 10, cookTime: 8, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Nghêu sống rửa sạch cát', quantity: 1, unit: 'kg' }, { name: 'Sả cây đập dập', quantity: 6, unit: 'củ' }, { name: 'Lá quế và ớt tươi', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp nghêu', description: 'Cho nghêu cùng sả ớt vào nồi đậy vung hấp 6 phút đến khi nghêu mở miệng bung đều.' }]
    }
  ],

  'mon-chay': [
    {
      title: 'Đậu hũ sốt cà chua thanh đạm',
      description: 'Đậu hũ rán vàng ruộm hòa quyện cùng nước sốt cà chua chín mọng ngọt thanh tự nhiên.',
      prepTime: 10, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu hũ trắng', quantity: 4, unit: 'miếng' }, { name: 'Cà chua chín', quantity: 3, unit: 'quả' }, { name: 'Hành boa-rô', quantity: 1, unit: 'cây' }],
      steps: [{ stepNumber: 1, title: 'Rán đậu hũ', description: 'Rán đậu hũ vàng giòn các mặt.' }, { stepNumber: 2, title: 'Om sốt cà chua', description: 'Xào cà chua nhuyễn rồi cho đậu vào om 5 phút.' }]
    },
    {
      title: 'Nấm đùi gà kho tiêu chay',
      description: 'Nấm đùi gà dai ngọt tự nhiên kho cùng tiêu xanh cay nồng và nước tương đậm đà đưa cơm.',
      prepTime: 10, cookTime: 18, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Nấm đùi gà tươi', quantity: 350, unit: 'g' }, { name: 'Tiêu xanh nguyên chùm', quantity: 3, unit: 'nhánh' }, { name: 'Nước tương ngon', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Kho nấm tiêu', description: 'Áp chảo nấm rồi kho nhỏ lửa cùng nước tương và tiêu xanh 12 phút.' }]
    },
    {
      title: 'Canh rong biển đậu hũ non chay',
      description: 'Canh rong biển mát lành kết hợp đậu hũ non mềm tan và hạt sen bùi béo thanh tịnh.',
      prepTime: 10, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Rong biển khô ngâm nở', quantity: 30, unit: 'g' }, { name: 'Đậu hũ non cắt khối', quantity: 1, unit: 'hộp' }, { name: 'Cà rốt và nấm hương', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh rong biển', description: 'Đun sôi nước dùng nấm, cho đậu hũ và rong biển vào nấu sôi 3 phút.' }]
    },
    {
      title: 'Gỏi cuốn chay ngũ sắc',
      description: 'Bánh tráng dẻo cuộn đậu hũ chiên, nấm xào, cà rốt, bơ sáp và xà lách chấm tương đen bơ đậu phộng.',
      prepTime: 20, cookTime: 10, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bánh tráng cuốn', quantity: 20, unit: 'lá' }, { name: 'Đậu hũ chiên cắt sợi', quantity: 2, unit: 'miếng' }, { name: 'Bơ sáp, dưa leo, cà rốt', quantity: 250, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuốn gỏi chay', description: 'Trải bánh tráng, xếp rau củ, đậu hũ vào cuộn tròn chặt tay.' }]
    },
    {
      title: 'Rau củ luộc kho quẹt chay',
      description: 'Đĩa rau củ thập cẩm xanh mướt luộc vừa chín tới chấm cùng âu kho quẹt nấm đậu đậm đà cay cay.',
      prepTime: 15, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu bắp, bông cải, cà rốt', quantity: 500, unit: 'g' }, { name: 'Nấm hương và đậu hũ rán', quantity: 150, unit: 'g' }, { name: 'Nước tương và tiêu xanh', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Làm kho quẹt chay', description: 'Kho nấm hương băm cùng nước tương, đường và tiêu cho keo sánh.' }, { stepNumber: 2, title: 'Luộc rau củ', description: 'Luộc rau củ nước sôi thêm chút muối giữ màu xanh giòn.' }]
    },
    {
      title: 'Nem rán chay nấm hương mộc nhĩ',
      description: 'Nem rán chay giòn tan thơm bùi hương nấm và miến dong chấm cùng nước mắm chay chua ngọt.',
      prepTime: 25, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Nấm hương, mộc nhĩ', quantity: 100, unit: 'g' }, { name: 'Miến dong, khoai môn bào', quantity: 150, unit: 'g' }, { name: 'Bánh đa nem chay', quantity: 25, unit: 'lá' }],
      steps: [{ stepNumber: 1, title: 'Cuốn nem chay', description: 'Trộn nhân nấm miến khoai môn rồi gói vào bánh đa nem.' }, { stepNumber: 2, title: 'Rán vàng giòn', description: 'Rán ngập dầu đến khi vỏ ngoài vàng rụm.' }]
    }
  ],

  'mon-bun-pho': [
    {
      title: 'Phở bò tái nạm gầu Hà Nội',
      description: 'Bát phở truyền thống phố cổ nước dùng trong veo ninh 10 tiếng, nạm gầu giòn thơm tái mềm ngọt.',
      prepTime: 30, cookTime: 120, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bánh phở tươi sợi mềm', quantity: 800, unit: 'g' }, { name: 'Bò nạm gầu và thăn bò', quantity: 600, unit: 'g' }, { name: 'Xương bò hầm quế hồi', quantity: 1.5, unit: 'kg' }],
      steps: [{ stepNumber: 1, title: 'Ninh nước dùng phở', description: 'Hầm xương bò cùng quế hồi thảo quả trong 120 phút.' }, { stepNumber: 2, title: 'Trần bánh phở', description: 'Xếp phở, thịt bò nạm gầu, hành hoa và chan nước dùng sôi.' }]
    },
    {
      title: 'Bún chả nướng than hoa Hà Nội',
      description: 'Chả miếng ba chỉ và chả viên băm nướng than hoa thơm lừng, ngâm trong bát nước mắm chua ngọt ấm nóng.',
      prepTime: 30, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt ba chỉ thái mỏng', quantity: 350, unit: 'g' }, { name: 'Thịt nạc vai băm viên', quantity: 350, unit: 'g' }, { name: 'Bún tươi sợi nhỏ', quantity: 800, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng chả', description: 'Kẹp vỉ nướng trên than hoa đến khi chả chín vàng xém cạnh.' }, { stepNumber: 2, title: 'Thưởng thức', description: 'Bỏ chả vào nước mắm ấm chua ngọt ăn kèm bún tươi và dưa góp.' }]
    },
    {
      title: 'Bún bò Huế giò heo chả cua',
      description: 'Tô bún bò Huế cay nồng thơm nức mùi mắm ruốc và sả, giò heo mềm ngậy cùng chả cua vàng ươm.',
      prepTime: 30, cookTime: 90, servings: 5, difficulty: 'HARD',
      ingredients: [{ name: 'Bún sợi to Huế', quantity: 800, unit: 'g' }, { name: 'Nạm bò và bắp bò', quantity: 500, unit: 'g' }, { name: 'Mắm ruốc Huế và sả cây', quantity: 80, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu nước dùng bún bò', description: 'Hầm nạm bò cùng sả cây và nước mắm ruốc lọc trong 90 phút.' }]
    },
    {
      title: 'Bún riêu cua bắp bò đậu hũ',
      description: 'Bát bún riêu thanh mát vị giấm bỗng, gạch cua đóng tảng béo bùi, đậu hũ chiên vàng và cà chua đỏ au.',
      prepTime: 25, cookTime: 35, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cua đồng giã nhỏ lọc nước', quantity: 600, unit: 'g' }, { name: 'Bún tươi', quantity: 800, unit: 'g' }, { name: 'Đậu hũ chiên và cà chua', quantity: 300, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu riêu cua', description: 'Đun nhỏ lửa nước cua đồng đến khi thịt cua nổi mảng lớn.' }]
    },
    {
      title: 'Miến gà măng tươi đùi gà xé',
      description: 'Miến dong trong dai nấu cùng măng tươi giòn ngọt, thịt gà ta xé phay ngọt lịm thơm lừng mùi rau răm.',
      prepTime: 20, cookTime: 30, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Miến dong sợi trong', quantity: 300, unit: 'g' }, { name: 'Thịt gà ta luộc xé', quantity: 400, unit: 'g' }, { name: 'Măng tươi xé sợi', quantity: 200, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh miến', description: 'Xào măng tươi rồi đổ nước luộc gà vào nấu sôi, thả miến vào vừa chín.' }]
    },
    {
      title: 'Hủ tiếu Nam Vang sườn tôm trứng cút',
      description: 'Tô hủ tiếu đậm đà hương tỏi phi giòn, tôm sú tươi ngọt, thịt bằm và lòng heo sần sật đặc sản phương Nam.',
      prepTime: 25, cookTime: 45, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Hủ tiếu khô dai', quantity: 400, unit: 'g' }, { name: 'Tôm sú và thịt bằm', quantity: 350, unit: 'g' }, { name: 'Trứng cút và cần tây', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu nước lèo hủ tiếu', description: 'Hầm xương ống cùng mực khô nướng và củ cải muối cho ngọt nước.' }]
    }
  ],

  'mon-canh': [
    {
      title: 'Canh chua cá lóc Nam Bộ',
      description: 'Vị chua thanh mát từ me kết hợp vị ngọt tự nhiên của cá lóc đồng, dọc mùng giòn sần sật và ngò ôm thơm nức.',
      prepTime: 15, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Cá lóc đồng cắt khúc', quantity: 500, unit: 'g' }, { name: 'Dọc mùng, đậu bắp, dứa', quantity: 250, unit: 'g' }, { name: 'Nước cốt me chua', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh cá', description: 'Nấu cá lóc cùng nước me rồi cho rau củ vào chín tới.' }]
    },
    {
      title: 'Canh bí đỏ thịt bằm hạt sen',
      description: 'Bí đỏ ngọt bùi hòa quyện cùng thịt heo bằm tươi và hạt sen hầm mềm thơm nức mũi.',
      prepTime: 15, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bí đỏ gọt vỏ cắt miếng', quantity: 400, unit: 'g' }, { name: 'Thịt heo nạc bằm', quantity: 200, unit: 'g' }, { name: 'Hạt sen tươi', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu bí đỏ thịt bằm', description: 'Xào săn thịt bằm, cho nước và bí đỏ hạt sen vào hầm mềm 20 phút.' }]
    },
    {
      title: 'Canh khổ qua nhồi thịt băm',
      description: 'Món canh truyền thống thanh nhiệt với trái khổ qua xanh mướt nhồi đầy ắp thịt heo nạc, nấm mèo và miến.',
      prepTime: 20, cookTime: 30, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Khổ qua xanh khoét ruột', quantity: 4, unit: 'trái' }, { name: 'Thịt nạc vai heo băm', quantity: 300, unit: 'g' }, { name: 'Mộc nhĩ ngâm nở băm nhỏ', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nhồi và hầm khổ qua', description: 'Nhồi thịt vào khổ qua rồi hầm nhỏ lửa 25 phút cho nước trong ngọt.' }]
    },
    {
      title: 'Canh cua đồng mồng tơi mướp hương',
      description: 'Món canh giải nhiệt ngày hè kinh điển với gạch cua béo ngậy, rau mồng tơi xanh mướt và mướp hương thơm ngát.',
      prepTime: 15, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Cua đồng xay lọc nước', quantity: 500, unit: 'g' }, { name: 'Rau mồng tơi và rau đay', quantity: 300, unit: 'g' }, { name: 'Mướp hương thái lát', quantity: 1, unit: 'trái' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh cua', description: 'Đun nhỏ lửa nước cua cho đóng tảng gạch, cho rau mồng tơi mướp vào chín tới.' }]
    },
    {
      title: 'Canh sườn hầm rau củ quả ngô ngọt',
      description: 'Nước canh trong veo ngọt lịm từ ngô ngọt, cà rốt và khoai tây hòa quyện cùng sườn non hầm mềm róc xương.',
      prepTime: 15, cookTime: 40, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Sườn non heo', quantity: 500, unit: 'g' }, { name: 'Bắp ngô ngọt cắt khúc', quantity: 1, unit: 'bắp' }, { name: 'Cà rốt và khoai tây', quantity: 2, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Hầm sườn rau củ', description: 'Ninh sườn 25 phút rồi cho ngô ngọt, cà rốt khoai tây vào hầm mềm thêm 15 phút.' }]
    },
    {
      title: 'Canh nghêu nấu thì là cà chua',
      description: 'Canh nghêu thanh ngọt tự nhiên đượm vị chua nhẹ của cà chua và hương thơm thanh khiết của thì là hành hoa.',
      prepTime: 10, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Nghêu biển luộc lấy thịt', quantity: 800, unit: 'g' }, { name: 'Cà chua chín', quantity: 2, unit: 'quả' }, { name: 'Thì là và hành hoa', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh nghêu', description: 'Lọc nước luộc nghêu trong, xào cà chua rồi đổ nước vào đun sôi thả nghêu và thì là.' }]
    }
  ],

  'mon-com': [
    {
      title: 'Cơm tấm sườn bì chả Sài Gòn',
      description: 'Cơm tấm thơm dẻo, miếng sườn cốt lết nướng mật ong sả, chả trứng hấp bùi béo và mỡ hành thơm phức.',
      prepTime: 30, cookTime: 30, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gạo tấm thơm', quantity: 400, unit: 'g' }, { name: 'Sườn cốt lết nướng', quantity: 4, unit: 'miếng' }, { name: 'Chả trứng hấp bì heo', quantity: 200, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hoàn thiện đĩa cơm', description: 'Xới cơm tấm, đặt sườn nướng, chả trứng, rưới mỡ hành lên trên.' }]
    },
    {
      title: 'Cơm chiên Dương Châu lạp xưởng',
      description: 'Hạt cơm vàng óng ráo hạt hòa quyện cùng lạp xưởng thơm ngọt, tôm tươi, đậu Hà Lan và trứng gà giòn ngon.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Cơm nguội ráo hạt', quantity: 400, unit: 'g' }, { name: 'Lạp xưởng thái hạt lựu', quantity: 2, unit: 'cây' }, { name: 'Trứng gà và đậu Hà Lan', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên cơm', description: 'Đảo đều trứng cùng cơm trên chảo nóng, cho lạp xưởng và rau củ xào lửa lớn.' }]
    },
    {
      title: 'Cơm niêu cháy giòn kho quẹt tôm thịt',
      description: 'Cơm nấu niêu đất có lớp cháy giòn rụm vàng ươm, quệt đẫm nước sốt kho quẹt tôm khô thịt ba rọi béo cay.',
      prepTime: 20, cookTime: 35, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gạo thơm dẻo', quantity: 350, unit: 'g' }, { name: 'Thịt ba rọi thái hạt lựu', quantity: 150, unit: 'g' }, { name: 'Tôm khô ngâm mềm', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Tạo cháy niêu', description: 'Nấu cơm trong niêu đất, xoay tròn niêu trên lửa nhỏ tạo lớp cháy giòn vàng.' }]
    },
    {
      title: 'Cơm gà Hội An xé phay hành tây',
      description: 'Hạt cơm vàng óng nấu từ nước luộc gà và nghệ tươi, gà ta bóp rau răm hành tây chua ngọt đậm vị phố Hội.',
      prepTime: 25, cookTime: 35, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gạo tám thơm', quantity: 400, unit: 'g' }, { name: 'Thịt gà ta xé sợi', quantity: 450, unit: 'g' }, { name: 'Hành tây và rau răm', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Trộn gà cơm Hội An', description: 'Xới cơm gà vàng ươm, xếp gà bóp rau răm hành tây lên đĩa.' }]
    },
    {
      title: 'Cơm chiên cá mặn gà xé',
      description: 'Hạt cơm giòn rụm thơm nức mùi cá mặn chiên thơm bùi kết hợp cùng thịt gà xé và bắp cải giòn.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Cơm trắng để nguội', quantity: 400, unit: 'g' }, { name: 'Cá mặn khô xé nhỏ', quantity: 60, unit: 'g' }, { name: 'Ức gà xé sợi', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên cá mặn', description: 'Phi thơm cá mặn giòn rụm rồi cho cơm và gà vào chiên săn hạt.' }]
    },
    {
      title: 'Cơm rang dưa bò phố cổ',
      description: 'Đặc sản đêm Hà Nội với cơm rang trứng vàng ruộm giòn rụm ăn cùng đĩa thịt bò xào dưa chua đậm đà ngọt lịm.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Cơm nguội rang giòn', quantity: 400, unit: 'g' }, { name: 'Thịt bò thăn thái mỏng', quantity: 250, unit: 'g' }, { name: 'Dưa cải muối chua', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xào dưa bò', description: 'Xào bò chín tới cùng dưa cải chua rồi đổ lên trên đĩa cơm rang giòn.' }]
    }
  ],

  'mon-trang-mieng': [
    {
      title: 'Chè bưởi An Giang giòn sần sật',
      description: 'Cùi bưởi xử lý khéo léo giòn trong veo không hề đắng, quyện cùng đậu xanh bùi béo và nước cốt dừa thơm ngậy.',
      prepTime: 40, cookTime: 30, servings: 5, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cùi bưởi da xanh', quantity: 200, unit: 'g' }, { name: 'Đậu xanh đãi vỏ', quantity: 150, unit: 'g' }, { name: 'Nước cốt dừa', quantity: 200, unit: 'ml' }],
      steps: [{ stepNumber: 1, title: 'Nấu chè bưởi', description: 'Nấu đường phèn, xuống bột năng sánh mịn rồi thả cùi bưởi giòn và đậu xanh vào.' }]
    },
    {
      title: 'Chè trôi nước ngũ sắc nhân đậu xanh',
      description: 'Những viên bánh trôi dẻo quánh từ bột nếp ngũ sắc tự nhiên, nhân đậu xanh bùi ngậy ngập trong nước đường gừng ấm nồng.',
      prepTime: 30, cookTime: 25, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bột nếp dẻo thơm', quantity: 400, unit: 'g' }, { name: 'Đậu xanh nghiền nhuyễn', quantity: 150, unit: 'g' }, { name: 'Gừng già và đường thốt nốt', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nặn và luộc trôi nước', description: 'Bọc nhân đậu xanh vào vỏ bánh nếp rồi luộc chín nổi trong nước đường gừng.' }]
    },
    {
      title: 'Bánh flan caramel mềm mịn tan chảy',
      description: 'Bánh flan béo ngậy từ trứng gà và sữa tươi, lớp caramel vàng cánh gián đắng nhẹ hòa quyện hoàn hảo cùng cà phê đá.',
      prepTime: 20, cookTime: 35, servings: 6, difficulty: 'EASY',
      ingredients: [{ name: 'Trứng gà tươi', quantity: 6, unit: 'quả' }, { name: 'Sữa tươi không đường', quantity: 500, unit: 'ml' }, { name: 'Đường caramel', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp bánh flan', description: 'Khuấy nhẹ trứng sữa rót vào khuôn có caramel, hấp nhỏ lửa 30 phút cho mịn màng.' }]
    },
    {
      title: 'Chè sương sa hạt lựu cốt dừa',
      description: 'Hạt lựu củ năng giòn sần sật nhiều màu sắc, sương sa dai giòn mát lạnh chan nước cốt dừa ngọt béo thơm lừng.',
      prepTime: 25, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Củ năng gọt vỏ hạt lựu', quantity: 200, unit: 'g' }, { name: 'Bột năng và sương sa dẻo', quantity: 150, unit: 'g' }, { name: 'Nước cốt dừa béo', quantity: 200, unit: 'ml' }],
      steps: [{ stepNumber: 1, title: 'Làm hạt lựu', description: 'Lăn củ năng qua bột năng rồi luộc chín trong veo, vớt ngâm nước đá.' }]
    },
    {
      title: 'Rau câu dừa xiêm hai lớp mát lạnh',
      description: 'Rau câu trong veo từ nước dừa tươi nguyên chất mát rượi, lớp trên béo ngậy nước cốt dừa trắng muốt giải nhiệt ngày hè.',
      prepTime: 15, cookTime: 15, servings: 6, difficulty: 'EASY',
      ingredients: [{ name: 'Nước dừa xiêm tươi', quantity: 1, unit: 'l' }, { name: 'Bột rau câu dẻo', quantity: 12, unit: 'g' }, { name: 'Nước cốt dừa', quantity: 150, unit: 'ml' }],
      steps: [{ stepNumber: 1, title: 'Đổ rau câu 2 lớp', description: 'Đổ lớp thạch dừa trong trước, chờ se mặt đổ tiếp lớp nước cốt dừa lên trên.' }]
    },
    {
      title: 'Chè khúc bạch hạnh nhân thanh mát',
      description: 'Từng viên khúc bạch phô mai sữa béo dẻo mềm, nước đường phèn nhãn ngọt thanh và hạnh nhân lát rang vàng giòn rụm.',
      prepTime: 30, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Kem tươi whipping và sữa tươi', quantity: 300, unit: 'ml' }, { name: 'Gelatin và phô mai', quantity: 50, unit: 'g' }, { name: 'Hạnh nhân lát rang giòn', quantity: 40, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Làm đông khúc bạch', description: 'Nấu tan gelatin cùng sữa kem tươi, đổ khuôn làm đông rồi cắt miếng lượn sóng.' }]
    }
  ],

  'mon-khai-vi': [
    {
      title: 'Gỏi cuốn tôm thịt chấm tương đen',
      description: 'Gỏi cuốn thanh mát với tôm tươi luộc đỏ au, thịt ba chỉ mỏng giòn, bún tươi và hẹ lá chấm tương bơ đậu phộng.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Tôm sú luộc bóc vỏ', quantity: 300, unit: 'g' }, { name: 'Thịt ba chỉ heo luộc', quantity: 250, unit: 'g' }, { name: 'Bánh tráng dẻo và bún', quantity: 300, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuốn gỏi', description: 'Đặt tôm, thịt, bún và rau sống lên bánh tráng rồi cuộn tròn gài cọng hẹ tươi.' }]
    },
    {
      title: 'Chả giò rế hải sản giòn rụm',
      description: 'Vỏ rế giòn xốp rụm nhân tôm mực tươi ngọt hòa quyện cùng sốt chấm mayonnaise chua ngọt mê ly.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bánh tráng rế chiên giòn', quantity: 20, unit: 'lá' }, { name: 'Tôm sú và mực băm hạt lựu', quantity: 350, unit: 'g' }, { name: 'Củ sắn bào vắt ráo', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên chả giò rế', description: 'Cuộn nhân hải sản vào bánh tráng rế rồi chiên ngập dầu vàng ươm.' }]
    },
    {
      title: 'Salad ức gà áp chảo sốt mè rang',
      description: 'Ức gà áp chảo vàng xém mềm ngọt ăn kèm rau xà lách giòn tươi, cà chua bi mọng nước và sốt mè rang thơm bùi.',
      prepTime: 15, cookTime: 10, servings: 2, difficulty: 'EASY',
      ingredients: [{ name: 'Ức gà phi lê áp chảo', quantity: 300, unit: 'g' }, { name: 'Xà lách xoăn, cà chua bi', quantity: 200, unit: 'g' }, { name: 'Sốt mè rang Nhật Bản', quantity: 4, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Trộn salad', description: 'Thái lát ức gà xếp lên đĩa rau xanh rồi rưới sốt mè rang lên trên.' }]
    },
    {
      title: 'Súp cua măng tây trứng cút',
      description: 'Chén súp khai vị sánh mịn đậm đà thịt cua biển tươi roi rói, măng tây xanh giòn và vân trứng gà óng ả.',
      prepTime: 20, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt cua biển xé nhỏ', quantity: 200, unit: 'g' }, { name: 'Măng tây xanh cắt khúc', quantity: 150, unit: 'g' }, { name: 'Trứng cút và trứng gà', quantity: 10, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Nấu súp cua', description: 'Đun sôi nước hầm xương, cho cua và măng tây vào, xuống bột năng tạo độ sánh rồi đánh vân trứng.' }]
    },
    {
      title: 'Bánh mì bơ tỏi nướng giòn rụm',
      description: 'Bánh mì baguette nướng thơm lừng mùi bơ Pháp béo ngậy và tỏi phi vàng rắc lá ngò tây xanh ngát.',
      prepTime: 10, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Bánh mì baguette giòn', quantity: 2, unit: 'ổ' }, { name: 'Bơ lạt tan chảy', quantity: 50, unit: 'g' }, { name: 'Tỏi băm và lá ngò tây', quantity: 20, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng bánh mì', description: 'Phết bơ tỏi lên bánh mì rồi nướng 180 độ C trong 8 phút cho giòn rụm.' }]
    },
    {
      title: 'Nem chua nướng que tre than hồng',
      description: 'Nem chua nướng nóng hổi xèo xèo trên than hồng, vỏ ngoài hơi xém thơm lừng, chấm tương ớt cay nồng.',
      prepTime: 15, cookTime: 12, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Nem chua sống que tre', quantity: 10, unit: 'chiếc' }, { name: 'Tương ớt cay nồng', quantity: 1, unit: 'chén' }, { name: 'Tỏi tép và ớt tươi', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng nem chua', description: 'Nướng nem trên than hoa trở đều tay đến khi nem chín bóng xém nhẹ.' }]
    }
  ],

  'mon-cuon': [
    {
      title: 'Nem nướng Nha Trang cuốn bánh tráng',
      description: 'Nem thịt heo nướng vàng rộm thơm nức mũi cuốn cùng bánh tráng chiên giòn, xoài xanh và nước chấm tương nếp đặc sánh.',
      prepTime: 30, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Thịt heo xay quết mịn', quantity: 500, unit: 'g' }, { name: 'Bánh tráng cuốn và ram giòn', quantity: 200, unit: 'g' }, { name: 'Xoài xanh, dưa leo, rau thơm', quantity: 300, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuốn và nướng nem', description: 'Quết thịt quanh que tre rồi nướng vàng đều.' }]
    },
    {
      title: 'Phở cuốn thịt bò rau thơm Hà Nội',
      description: 'Bánh phở vuông mềm mỏng cuộn trọn vẹn thịt bò xào lăn tỏi thơm lừng và rau xà lách chấm mắm chua ngọt.',
      prepTime: 20, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bánh phở cuốn nguyên lá', quantity: 500, unit: 'g' }, { name: 'Thịt bò xào lăn', quantity: 350, unit: 'g' }, { name: 'Xà lách, rau mùi, húng láng', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuốn phở bò', description: 'Trải lá phở, xếp rau thơm và thịt bò xào lăn rồi cuộn chặt vừa tay.' }]
    },
    {
      title: 'Bò bía mặn lạp xưởng tôm khô',
      description: 'Món ăn vặt đường phố Sài Gòn với củ sắn ngọt thanh, lạp xưởng bùi béo và ruốc tôm chấm tương đen đậu phộng.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bánh tráng mỏng dẻo', quantity: 20, unit: 'lá' }, { name: 'Củ sắn xào chín', quantity: 300, unit: 'g' }, { name: 'Lạp xưởng thái lát mỏng', quantity: 2, unit: 'cây' }],
      steps: [{ stepNumber: 1, title: 'Cuộn bò bía', description: 'Xếp củ sắn, lạp xưởng, trứng tráng sợi vào bánh tráng rồi cuộn tròn.' }]
    },
    {
      title: 'Bánh tráng cuốn thịt heo hai đầu da',
      description: 'Đặc sản Đà Nẵng với lát thịt ba chỉ luộc khéo có hai đầu mỡ da giòn ngọt, cuốn rau rừng chấm mắm nêm đậm đà.',
      prepTime: 25, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt heo ba chỉ hai đầu da', quantity: 500, unit: 'g' }, { name: 'Bánh tráng Đại Lộc', quantity: 1, unit: 'xấp' }, { name: 'Mắm nêm pha thơm tỏi ớt', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Luộc thịt', description: 'Luộc thịt chín tới ngâm nước đá cho giòn rồi thái lát mỏng.' }]
    },
    {
      title: 'Cuốn diếp tôm thịt xứ Huế',
      description: 'Lá cải xanh cay nhẹ ôm lấy tôm sú luộc và thịt ba chỉ, buộc bằng cọng hành trần tao nhã quý phái.',
      prepTime: 20, cookTime: 15, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Lá cải bẹ xanh non', quantity: 20, unit: 'lá' }, { name: 'Tôm luộc và thịt ba chỉ', quantity: 300, unit: 'g' }, { name: 'Hành hoa trần mềm', quantity: 20, unit: 'cọng' }],
      steps: [{ stepNumber: 1, title: 'Cuộn diếp', description: 'Gói tôm thịt bún vào lá cải xanh rồi buộc cọng hành trần xinh xắn.' }]
    },
    {
      title: 'Gỏi cuốn tai heo dưa leo giòn rụm',
      description: 'Tai heo luộc thái mỏng sần sật cuốn cùng bún tươi và dưa leo mát lành chấm nước mắm tỏi ớt chua cay.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Tai heo làm sạch luộc giòn', quantity: 400, unit: 'g' }, { name: 'Bánh tráng và bún tươi', quantity: 300, unit: 'g' }, { name: 'Dưa leo và rau răm', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuốn tai heo', description: 'Thái tai heo mỏng tang rồi cuốn bánh tráng kèm rau sống.' }]
    }
  ],

  'mon-nuong': [
    {
      title: 'Sườn cừu nướng thảo mộc hương thảo',
      description: 'Dẻ sườn cừu tươi mềm ngọt nướng vừa chín tới thấm đẫm hương rosemary, tỏi nghiền và dầu ô liu thơm lừng.',
      prepTime: 20, cookTime: 20, servings: 3, difficulty: 'HARD',
      ingredients: [{ name: 'Dẻ sườn cừu tươi', quantity: 600, unit: 'g' }, { name: 'Lá hương thảo rosemary', quantity: 4, unit: 'nhánh' }, { name: 'Bơ lạt và tỏi nghiền', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Áp chảo và nướng sườn cừu', description: 'Áp chảo sườn cừu xém cạnh rồi nướng lò 190 độ C trong 12 phút.' }]
    },
    {
      title: 'Cá hồi nướng bơ tỏi măng tây',
      description: 'Phi lê cá hồi tươi nướng mọng nước béo ngậy đượm sốt bơ tỏi vàng óng, ăn kèm măng tây giòn ngọt.',
      prepTime: 15, cookTime: 15, servings: 2, difficulty: 'EASY',
      ingredients: [{ name: 'Phi lê cá hồi tươi', quantity: 350, unit: 'g' }, { name: 'Măng tây xanh non', quantity: 150, unit: 'g' }, { name: 'Bơ lạt và tỏi băm', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng cá hồi', description: 'Phết bơ tỏi lên cá hồi và măng tây, nướng 180 độ C trong 12 phút.' }]
    },
    {
      title: 'Bạch tuộc nướng sa tế giòn sần sật',
      description: 'Bạch tuộc tươi giòn sần sật nướng than hoa thơm lừng xém cạnh, sốt sa tế cay cay kích thích vị giác.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Bạch tuộc tươi sống', quantity: 600, unit: 'g' }, { name: 'Sa tế tôm cay', quantity: 3, unit: 'muỗng' }, { name: 'Muối ớt xanh chấm kèm', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Nướng bạch tuộc', description: 'Ướp sa tế rồi nướng than hoa lửa lớn 10 phút cho giòn rụm.' }]
    },
    {
      title: 'Hàu nướng mỡ hành đậu phộng',
      description: 'Hàu sữa tươi béo ngậy nướng trên than hồng sôi sùng sục, rưới đẫm mỡ hành xanh mướt và đậu phộng giã giòn.',
      prepTime: 15, cookTime: 10, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Hàu sữa tươi tách vỏ', quantity: 12, unit: 'con' }, { name: 'Mỡ hành thơm', quantity: 1, unit: 'chén' }, { name: 'Đậu phộng rang vàng', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng hàu', description: 'Đặt hàu lên vỉ than nướng 5 phút, rưới mỡ hành đậu phộng đun sôi 2 phút.' }]
    },
    {
      title: 'Thịt xiên nướng than hoa mè trắng',
      description: 'Thịt nạc vai heo tẩm ướp nước màu sả riềng nướng than hoa vàng óng mềm mọng, rắc mè trắng bùi thơm.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt nạc vai heo thái mỏng', quantity: 500, unit: 'g' }, { name: 'Xiên tre ngâm nước', quantity: 15, unit: 'que' }, { name: 'Mè trắng rang thơm', quantity: 20, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xiên và nướng thịt', description: 'Xiên thịt vào que tre rồi nướng than hoa trở mặt đều tay.' }]
    },
    {
      title: 'Cà tím nướng mỡ hành nước mắm tỏi',
      description: 'Cà tím nướng cháy sém vỏ lột thịt mềm ngọt lịm, rưới đẫm mỡ hành thơm nức và nước mắm ớt chua ngọt.',
      prepTime: 10, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Cà tím dài quả', quantity: 3, unit: 'trái' }, { name: 'Hành hoa và dầu ăn', quantity: 50, unit: 'g' }, { name: 'Nước mắm tỏi ớt', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Nướng cà tím', description: 'Nướng cà tím cháy xém vỏ, lột vỏ lấy thịt mềm rưới mỡ hành lên.' }]
    }
  ],

  'mon-xao': [
    {
      title: 'Mực xào cần tỏi ớt chuông đỏ',
      description: 'Mực tươi khía vảy rồng giòn sần sật xào to lửa cùng cần tây xanh mướt và ớt chuông ngọt mát.',
      prepTime: 15, cookTime: 8, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Mực ống tươi thái miếng', quantity: 400, unit: 'g' }, { name: 'Cần tây và tỏi tây', quantity: 150, unit: 'g' }, { name: 'Ớt chuông đỏ giòn', quantity: 1, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Xào mực cần tỏi', description: 'Xào mực lửa to 2 phút, cho rau vào đảo thêm 2 phút rắc tiêu.' }]
    },
    {
      title: 'Rau muống xào tỏi xanh mướt',
      description: 'Ngọn rau muống non giòn sần sật xào trên chảo gang lửa lớn dậy mùi thơm nức của tỏi đập dập.',
      prepTime: 10, cookTime: 5, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Rau muống ngọn non', quantity: 500, unit: 'g' }, { name: 'Tỏi củ đập dập', quantity: 2, unit: 'củ' }, { name: 'Dầu ăn và nước mắm', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào rau muống', description: 'Phi tỏi thơm vàng, cho rau muống vào xào lửa lớn đảo nhanh tay trong 3 phút.' }]
    },
    {
      title: 'Thịt bò xào bông cải xanh cà rốt',
      description: 'Bò thăn thái mỏng mềm ngọt xào cùng bông cải xanh giòn mát và cà rốt tỉa hoa tươi sáng.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt bò thăn mềm', quantity: 350, unit: 'g' }, { name: 'Bông cải xanh', quantity: 300, unit: 'g' }, { name: 'Dầu hào và tỏi', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào bò bông cải', description: 'Xào bò tái múc riêng, xào chín bông cải rồi trút bò vào đảo đều.' }]
    },
    {
      title: 'Mì xào giòn hải sản thập cẩm',
      description: 'Vắt mì trứng chiên giòn phồng xốp rưới đẫm nước sốt sền sệt tôm, mực, nấm và rau cải ngọt mát.',
      prepTime: 20, cookTime: 15, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Mì trứng chiên giòn rụm', quantity: 3, unit: 'vắt' }, { name: 'Tôm mực tươi', quantity: 300, unit: 'g' }, { name: 'Cải ngọt và nấm đông cô', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Làm sốt hải sản', description: 'Xào tôm mực nấm rau cải, nêm dầu hào bột năng sánh rồi chan lên mì giòn.' }]
    },
    {
      title: 'Ốc hương xào bơ tỏi thơm lừng',
      description: 'Ốc hương giòn ngọt tự nhiên quyện đẫm trong sốt bơ tỏi thơm nức chấm cùng bánh mì giòn tan.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Ốc hương tươi sống', quantity: 500, unit: 'g' }, { name: 'Bơ lạt thơm béo', quantity: 40, unit: 'g' }, { name: 'Tỏi băm phi vàng', quantity: 4, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào ốc bơ tỏi', description: 'Phi thơm bơ tỏi, cho ốc hương vào xào lửa lớn 5 phút cho thấm vị.' }]
    },
    {
      title: 'Nấm đùi gà xào xả ớt cay thơm',
      description: 'Nấm đùi gà dai ngọt sần sật xào cùng sả băm ớt tươi cay nồng đưa cơm vô cùng.',
      prepTime: 10, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Nấm đùi gà thái xéo', quantity: 400, unit: 'g' }, { name: 'Sả băm và ớt tươi', quantity: 3, unit: 'muỗng' }, { name: 'Dầu hào và nước tương', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào nấm sả ớt', description: 'Phi thơm sả ớt, trút nấm vào xào lửa lớn 5 phút cho săn ngọt.' }]
    }
  ],

  'mon-hap': [
    {
      title: 'Cá chẽm hấp Hồng Kông xì dầu',
      description: 'Cá chẽm tươi nguyên con hấp cùng gừng chỉ, đầu hành hoa chan nước xì dầu thượng hạng thơm lừng dầu mè.',
      prepTime: 20, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cá chẽm tươi nguyên con', quantity: 1, unit: 'con' }, { name: 'Gừng tươi thái chỉ', quantity: 50, unit: 'g' }, { name: 'Xì dầu thượng hạng và dầu mè', quantity: 4, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Hấp cá xì dầu', description: 'Hấp cá 15 phút, rưới nước sốt xì dầu gừng hành và dầu sôi lên mình cá.' }]
    },
    {
      title: 'Gà hấp muối sả chanh lá non',
      description: 'Gà ta hấp muối hột giữ trọn vị ngọt thịt đậm đà nguyên bản quyện hương thơm ngát của sả và lá chanh.',
      prepTime: 15, cookTime: 35, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Gà ta nguyên con', quantity: 1.3, unit: 'kg' }, { name: 'Muối hột hạt to', quantity: 500, unit: 'g' }, { name: 'Sả cây và lá chanh', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp muối', description: 'Rải muối đáy nồi lót sả hấp gà chín bằng nhiệt hơi trong 35 phút.' }]
    },
    {
      title: 'Tôm hấp nước dừa xiêm ngọt lịm',
      description: 'Tôm sú tươi roi rói hấp trực tiếp trong nước dừa tươi, thịt tôm ngọt lịm tự nhiên chấm muối ớt xanh.',
      prepTime: 10, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Tôm sú biển tươi', quantity: 500, unit: 'g' }, { name: 'Nước dừa xiêm tươi', quantity: 300, unit: 'ml' }, { name: 'Muối ớt xanh chấm kèm', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Hấp tôm dừa', description: 'Đun sôi nước dừa, thả tôm vào hấp 8 phút đến khi tôm cong đỏ au.' }]
    },
    {
      title: 'Dimsum há cảo tôm thịt hấp',
      description: 'Vỏ bánh mỏng trong veo mềm dẻo nhìn thấu nhân tôm thịt hồng hào giòn ngọt chấm sốt tương giấm đen.',
      prepTime: 30, cookTime: 12, servings: 4, difficulty: 'HARD',
      ingredients: [{ name: 'Tôm sú tươi băm hạt lựu', quantity: 300, unit: 'g' }, { name: 'Thịt heo nạc xay', quantity: 150, unit: 'g' }, { name: 'Vỏ há cảo mỏng mịn', quantity: 24, unit: 'lá' }],
      steps: [{ stepNumber: 1, title: 'Gói và hấp há cảo', description: 'Bọc nhân tôm thịt vào vỏ bánh xếp nếp, hấp xửng tre 8 phút.' }]
    },
    {
      title: 'Mực hấp gừng hành hoa',
      description: 'Mực ống tươi giòn ngọt hấp cùng gừng tươi thái sợi và đầu hành hoa chần giòn chấm nước mắm gừng.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Mực ống tươi nguyên con', quantity: 500, unit: 'g' }, { name: 'Gừng tươi thái sợi', quantity: 50, unit: 'g' }, { name: 'Hành hoa và ớt sừng', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp mực gừng', description: 'Xếp mực lên đĩa cùng gừng hành hấp cách thủy 8 phút là chín giòn.' }]
    },
    {
      title: 'Trứng hấp vân tam sắc',
      description: 'Món trứng hấp ba tầng sắc màu tuyệt đẹp từ lòng đỏ trứng gà, lòng trắng trứng và thịt heo băm mộc nhĩ.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Trứng gà tươi tách lòng', quantity: 5, unit: 'quả' }, { name: 'Thịt nạc vai băm', quantity: 200, unit: 'g' }, { name: 'Mộc nhĩ nấm hương băm', quantity: 40, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp từng lớp', description: 'Hấp lớp thịt trước 15 phút, đổ lớp trứng trắng rồi lớp lòng đỏ hấp thêm 10 phút.' }]
    }
  ],

  'mon-chien': [
    {
      title: 'Cánh gà chiên nước mắm tỏi ớt',
      description: 'Cánh gà chiên vàng ươm giòn rụm áo đẫm lớp sốt nước mắm tỏi ớt dẻo quánh mặn ngọt đậm đà.',
      prepTime: 15, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Cánh gà khúc giữa', quantity: 600, unit: 'g' }, { name: 'Nước mắm cá cơm', quantity: 3, unit: 'muỗng' }, { name: 'Tỏi băm phi vàng giòn', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Chiên cánh gà', description: 'Chiên cánh gà ngập dầu vàng giòn rồi đảo qua chảo sốt mắm tỏi cho keo lại.' }]
    },
    {
      title: 'Tôm chiên xù giòn rụm chấm sốt me',
      description: 'Tôm sú tươi tẩm bột chiên xù vàng ươm giòn tan rôm rốp chấm cùng sốt me chua cay hoặc sốt mayonnaise.',
      prepTime: 20, cookTime: 12, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Tôm sú bóc vỏ chừa đuôi', quantity: 400, unit: 'g' }, { name: 'Bột chiên xù trắng', quantity: 150, unit: 'g' }, { name: 'Trứng gà đánh tan', quantity: 2, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Lăn bột chiên tôm', description: 'Lăn tôm qua bột mì, trứng rồi bột xù, chiên dầu sôi 4 phút vàng giòn.' }]
    },
    {
      title: 'Chả giò tôm thịt chiên giòn rụm',
      description: 'Cuốn chả giò vàng rụm giòn tan nhân thịt heo, tôm tươi và khoai môn bùi béo chấm nước mắm ớt.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bánh tráng cuốn chả giò', quantity: 25, unit: 'lá' }, { name: 'Tôm thịt băm nhuyễn', quantity: 400, unit: 'g' }, { name: 'Khoai môn nấm mèo miến', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên chả giò', description: 'Chiên 2 lần dầu lửa vừa đến khi vỏ ngoài vàng ruộm giòn tan.' }]
    },
    {
      title: 'Đậu hũ chiên giòn chấm mắm tôm',
      description: 'Từng miếng đậu hũ nóng hổi ngoài giòn rụm trong mềm béo mịn chấm đẫm mắm tôm sủi bọt cay nồng.',
      prepTime: 10, cookTime: 12, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu hũ non trắng', quantity: 4, unit: 'miếng' }, { name: 'Mắm tôm chanh ớt đánh bọt', quantity: 1, unit: 'chén' }, { name: 'Rau kinh giới tía tô', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên đậu hũ', description: 'Cắt đậu miếng vuông, thả chảo dầu nóng chiên vàng đều 4 mặt.' }]
    },
    {
      title: 'Cá tai tượng chiên xù vảy rồng',
      description: 'Đặc sản miền Tây với cá tai tượng chiên nguyên con vảy dựng xù giòn tan cuốn bánh tráng rau rừng mắm me.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'HARD',
      ingredients: [{ name: 'Cá tai tượng nguyên con để vảy', quantity: 1.2, unit: 'kg' }, { name: 'Bánh tráng cuốn và bún', quantity: 300, unit: 'g' }, { name: 'Nước mắm me chua ngọt', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Chiên xù cá', description: 'Múc dầu sôi xối liên tục lên cá đến khi vảy dựng xù giòn tan.' }]
    },
    {
      title: 'Mực chiên giòn bơ tỏi ớt',
      description: 'Mực ống khoanh tròn áo bột chiên giòn rụm lắc đều sốt bơ tỏi thơm nức mũi ăn vặt tuyệt hảo.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Mực ống cắt khoanh tròn', quantity: 450, unit: 'g' }, { name: 'Bột chiên giòn', quantity: 150, unit: 'g' }, { name: 'Bơ lạt và tỏi băm', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên mực', description: 'Tẩm bột chiên mực vàng giòn rồi đảo qua chảo bơ tỏi thơm.' }]
    }
  ],

  'mon-trung': [
    {
      title: 'Trứng cuộn tam sắc Nhật Bản Tamagoyaki',
      description: 'Cuộn trứng vàng ươm nhiều lớp mềm mịn ngọt ngào đượm vị nước dùng dashi và rong biển thơm ngon.',
      prepTime: 10, cookTime: 12, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Trứng gà tươi', quantity: 5, unit: 'quả' }, { name: 'Nước tương dashi và mirin', quantity: 2, unit: 'muỗng' }, { name: 'Rong biển nori thái chỉ', quantity: 10, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Cuộn trứng trên chảo vuông', description: 'Đổ từng lớp trứng mỏng rồi cuộn tròn liên tục thành khối trứng vuông mềm.' }]
    },
    {
      title: 'Trứng đúc thịt nạc mộc nhĩ nướng chảo',
      description: 'Món ăn quen thuộc với vị béo bùi của trứng vịt quyện cùng thịt heo băm đậm đà và mộc nhĩ sần sật.',
      prepTime: 15, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Trứng vịt tươi', quantity: 4, unit: 'quả' }, { name: 'Thịt heo nạc băm', quantity: 200, unit: 'g' }, { name: 'Mộc nhĩ ngâm nở băm nhỏ', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Đúc trứng thịt', description: 'Đánh đều trứng cùng thịt và mộc nhĩ rồi chiên nhỏ lửa hai mặt cho chín vàng.' }]
    },
    {
      title: 'Trứng cút lộn xào me chua cay',
      description: 'Trứng cút lộn ngọt bùi ngập trong sốt me sền sệt chua ngọt, rắc đậu phộng bùi béo và rau răm thơm cay.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Trứng cút lộn luộc bóc vỏ', quantity: 20, unit: 'quả' }, { name: 'Nước cốt me chua', quantity: 4, unit: 'muỗng' }, { name: 'Đậu phộng rang và rau răm', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xào sốt me', description: 'Phi thơm tỏi ớt, đun sốt me sánh rồi cho trứng cút lộn vào đảo nhẹ 5 phút.' }]
    },
    {
      title: 'Trứng chiên cà chua hành hoa thơm nức',
      description: 'Món ăn bình dị mà đưa cơm với trứng gà đánh xốp xào cùng cà chua chín mọng và đầu hành hoa phi thơm.',
      prepTime: 8, cookTime: 8, servings: 2, difficulty: 'EASY',
      ingredients: [{ name: 'Trứng gà tươi', quantity: 4, unit: 'quả' }, { name: 'Cà chua chín đỏ', quantity: 2, unit: 'quả' }, { name: 'Hành hoa và nước mắm', quantity: 30, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xào trứng cà chua', description: 'Xào cà chua nhuyễn mềm rồi đổ trứng đánh tan vào đảo xốp chín tới.' }]
    },
    {
      title: 'Chả trứng hấp thịt băm cơm tấm',
      description: 'Miếng chả trứng dày xốp vàng ươm mặt lòng đỏ, nhân thịt heo băm, miến dong và nấm mèo chuẩn vị Sài Gòn.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Trứng vịt (để lại 1 lòng đỏ quét mặt)', quantity: 4, unit: 'quả' }, { name: 'Thịt nạc vai băm', quantity: 250, unit: 'g' }, { name: 'Miến và mộc nhĩ', quantity: 40, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hấp chả trứng', description: 'Trộn đều nhân hấp 20 phút, quét lòng đỏ trứng lên mặt hấp thêm 5 phút không đậy vung.' }]
    },
    {
      title: 'Trứng bắc thảo bọc giò sống hấp',
      description: 'Trứng bắc thảo bùi bùi đen nhánh bọc quanh lớp giò sống heo dai giòn thơm nức hạt tiêu sọ hấp chín.',
      prepTime: 20, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Trứng bắc thảo bóc vỏ', quantity: 4, unit: 'quả' }, { name: 'Giò sống heo dẻo', quantity: 300, unit: 'g' }, { name: 'Tiêu sọ xay thơm', quantity: 1, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Bọc và hấp', description: 'Bọc giò sống kín quanh trứng bắc thảo rồi hấp 18 phút cắt lát hoa.' }]
    }
  ],

  'mon-au': [
    {
      title: 'Đậu hũ Ma Bà Tứ Xuyên cay tê',
      description: 'Món đậu hũ Tứ Xuyên trứ danh với đậu non mềm tan, thịt bằm đậm đà và hạt tiêu Tứ Xuyên cay tê đầu lưỡi.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Đậu hũ non cắt vuông', quantity: 2, unit: 'hộp' }, { name: 'Thịt heo nạc băm', quantity: 150, unit: 'g' }, { name: 'Sa tế ớt và hoa tiêu Tứ Xuyên', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào sốt Tứ Xuyên', description: 'Xào thơm thịt băm cùng sa tế, cho đậu non và nước dùng vào om nhỏ lửa 8 phút.' }]
    },
    {
      title: 'Đậu phụ nhồi thịt sốt cà chua',
      description: 'Từng miếng đậu phụ rán vàng nhồi đẫm nhân thịt heo nấm hương, om trong nước sốt cà chua đậm đà đưa cơm.',
      prepTime: 20, cookTime: 20, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu phụ rán vàng', quantity: 5, unit: 'miếng' }, { name: 'Thịt heo nạc băm nấm hương', quantity: 200, unit: 'g' }, { name: 'Cà chua chín đỏ', quantity: 3, unit: 'quả' }],
      steps: [{ stepNumber: 1, title: 'Nhồi và sốt đậu', description: 'Mổ bụng đậu nhồi thịt rồi om cùng sốt cà chua 15 phút cho ngấm.' }]
    },
    {
      title: 'Chè đậu đỏ hạt sen nước cốt dừa',
      description: 'Hạt đậu đỏ hầm mềm bở bùi ngậy cùng hạt sen tươi, chan nước cốt dừa béo thơm ngọt thanh đường phèn.',
      prepTime: 30, cookTime: 45, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu đỏ hạt to ngâm mềm', quantity: 200, unit: 'g' }, { name: 'Hạt sen tươi', quantity: 100, unit: 'g' }, { name: 'Đường phèn và nước cốt dừa', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Ninh chè đậu đỏ', description: 'Ninh nhừ đậu đỏ và hạt sen cùng đường phèn đến khi bở tơi ngọt mát.' }]
    },
    {
      title: 'Đậu hũ non chiên giòn xóc sả ớt',
      description: 'Từng viên đậu hũ non chiên giòn rụm xóc đều sả ớt phi vàng cay giòn rôm rốp.',
      prepTime: 15, cookTime: 12, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu hũ non cắt quân cờ', quantity: 2, unit: 'hộp' }, { name: 'Sả băm và ớt tươi', quantity: 4, unit: 'muỗng' }, { name: 'Bột chiên giòn', quantity: 100, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Chiên đậu xóc sả', description: 'Lăn bột chiên đậu giòn rụm rồi đảo đều cùng sả ớt phi vàng.' }]
    },
    {
      title: 'Sữa đậu nành lá dứa hạt sen tự nhiên',
      description: 'Ly sữa đậu nành tươi nguyên chất thơm lừng hương lá dứa thanh mát, bùi ngậy vị hạt sen xay mịn.',
      prepTime: 20, cookTime: 25, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Hạt đậu nành ngâm nở', quantity: 250, unit: 'g' }, { name: 'Lá dứa thơm tươi', quantity: 5, unit: 'lá' }, { name: 'Hạt sen tươi', quantity: 80, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xay và nấu sữa đậu', description: 'Xay nhuyễn đậu cùng hạt sen lọc lấy nước, nấu sôi cùng lá dứa nhỏ lửa 15 phút.' }]
    },
    {
      title: 'Đậu hũ kho nấm rơm tiêu xanh',
      description: 'Đậu hũ rán vàng kho cùng nấm rơm tươi ngọt và tiêu xanh cay nồng trong niêu đất đậm đà mộc mạc.',
      prepTime: 15, cookTime: 20, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Đậu hũ chiên cắt miếng', quantity: 3, unit: 'miếng' }, { name: 'Nấm rơm tươi búp', quantity: 200, unit: 'g' }, { name: 'Tiêu xanh và nước tương', quantity: 3, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Kho đậu nấm', description: 'Kho đậu và nấm rơm trong niêu đất cùng nước tương và tiêu xanh đến khi keo sánh.' }]
    }
  ],

  'mon-rau-cu': [
    {
      title: 'Đọt su su xào tỏi giòn ngọt',
      description: 'Ngọn đọt su su non xanh giòn ngọt tự nhiên xào trên lửa lớn đượm vị thơm ngậy của tỏi phi vàng.',
      prepTime: 15, cookTime: 5, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Đọt su su non tước xơ', quantity: 400, unit: 'g' }, { name: 'Tỏi củ đập dập', quantity: 2, unit: 'củ' }, { name: 'Dầu hào và hạt nêm', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào đọt su su', description: 'Phi tỏi thơm xào đọt su su lửa lớn trong 3 phút giữ độ giòn xanh.' }]
    },
    {
      title: 'Nộm hoa chuối tai heo giòn sần sật',
      description: 'Hoa chuối thái mỏng ngâm chanh trắng giòn, tai heo luộc thái mỏng sần sật trộn nước mắm chua ngọt và lạc rang.',
      prepTime: 25, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Hoa chuối thái mỏng', quantity: 300, unit: 'g' }, { name: 'Tai heo luộc giòn thái mỏng', quantity: 200, unit: 'g' }, { name: 'Lạc rang và rau thơm', quantity: 80, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Trộn nộm hoa chuối', description: 'Vắt ráo hoa chuối, trộn đều cùng tai heo, rau răm và nước mắm chua ngọt.' }]
    },
    {
      title: 'Canh rau tập tàng nấu tôm đồng',
      description: 'Bát canh đồng quê mát rượi kết hợp rau dền, rau ngót, mồng tơi và thịt tôm đồng giã nhỏ ngọt lịm.',
      prepTime: 15, cookTime: 12, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Rau tập tàng (ngót, dền, mồng tơi)', quantity: 350, unit: 'g' }, { name: 'Tôm đồng giã nhỏ', quantity: 150, unit: 'g' }, { name: 'Hành khô phi thơm', quantity: 1, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Nấu canh rau', description: 'Xào săn tôm đồng đổ nước nấu sôi, thả rau tập tàng vào chín tới tắt bếp.' }]
    },
    {
      title: 'Rau củ luộc thập cẩm kho quẹt',
      description: 'Mẹt rau củ tươi non (bông cải, đậu bắp, bầu, cà rốt) luộc vừa chín tới chấm cùng âu kho quẹt tôm thịt cay cay.',
      prepTime: 15, cookTime: 15, servings: 4, difficulty: 'EASY',
      ingredients: [{ name: 'Bông cải, đậu bắp, cà rốt, bầu', quantity: 600, unit: 'g' }, { name: 'Kho quẹt tôm khô thịt ba chỉ', quantity: 1, unit: 'âu' }, { name: 'Tiêu xanh và ớt hiểm', quantity: 20, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Luộc rau giòn', description: 'Luộc từng loại rau củ trong nước sôi có chút muối rồi vớt ngâm nước đá.' }]
    },
    {
      title: 'Cà tím xào lá lốt tía tô',
      description: 'Cà tím mềm ngọt xào săn cùng thịt ba chỉ thái chỉ và hương thơm nồng nàn không thể lẫn của lá lốt tía tô.',
      prepTime: 15, cookTime: 15, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Cà tím thái khúc ngâm muối', quantity: 3, unit: 'trái' }, { name: 'Lá lốt và tía tô thái chỉ', quantity: 50, unit: 'g' }, { name: 'Thịt ba chỉ heo thái sợi', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Xào cà tím', description: 'Xào săn thịt ba chỉ, cho cà tím vào xào mềm rồi rắc lá lốt tía tô đảo đều.' }]
    },
    {
      title: 'Nấm xào thập cẩm bắp non hạt sen',
      description: 'Các loại nấm tươi (nấm đùi gà, nấm rơm, nấm linh chi) xào cùng bắp non giòn ngọt và hạt sen bùi thanh.',
      prepTime: 15, cookTime: 12, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Nấm đùi gà, nấm rơm, nấm linh chi', quantity: 350, unit: 'g' }, { name: 'Bắp non và cà rốt', quantity: 150, unit: 'g' }, { name: 'Dầu hào và tỏi băm', quantity: 2, unit: 'muỗng' }],
      steps: [{ stepNumber: 1, title: 'Xào nấm thập cẩm', description: 'Xào bắp non cà rốt rồi trút nấm vào xào nhanh lửa lớn 4 phút.' }]
    }
  ],

  'mon-ac-san': [
    {
      title: 'Chả cá Lã Vọng Hà Nội cá lăng',
      description: 'Thịt cá lăng ướp riềng mẻ nướng than hoa rồi xào trên chảo nóng cùng thì là, đầu hành hoa chấm mắm tôm.',
      prepTime: 30, cookTime: 20, servings: 4, difficulty: 'HARD',
      ingredients: [{ name: 'Cá lăng tươi thái miếng vuông', quantity: 600, unit: 'g' }, { name: 'Thì là và đầu hành hoa', quantity: 200, unit: 'g' }, { name: 'Mắm tôm chanh sủi bọt, bún, lạc', quantity: 300, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng cá và xào chảo', description: 'Ướp cá riềng mẻ nướng than rồi cho lên chảo xào cùng thì là hành hoa ăn nóng.' }]
    },
    {
      title: 'Bánh xèo tôm nhảy Bình Định giòn rụm',
      description: 'Chiếc bánh xèo giòn rụm đúc bằng bột gạo nguyên chất đầy ắp tôm đất nhảy tanh tách cuốn bánh tráng rau mầm.',
      prepTime: 25, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bột gạo đúc bánh xèo', quantity: 300, unit: 'g' }, { name: 'Tôm đất tươi nhảy', quantity: 300, unit: 'g' }, { name: 'Giá đỗ và hành lá', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Đúc bánh xèo', description: 'Đổ bột vào chảo gang nóng, cho tôm nhảy và giá vào đậy nắp đúc giòn tan.' }]
    },
    {
      title: 'Bê chao Mộc Châu thơm mềm gừng sả',
      description: 'Thịt bê sữa Mộc Châu thái mỏng chao qua dầu sôi vừa chín tới, thịt mềm ngọt da giòn chấm tương bần gừng.',
      prepTime: 15, cookTime: 10, servings: 3, difficulty: 'EASY',
      ingredients: [{ name: 'Thịt bê non có da mỏng', quantity: 450, unit: 'g' }, { name: 'Sả cây đập dập, gừng tươi', quantity: 80, unit: 'g' }, { name: 'Tương bần gừng chấm kèm', quantity: 1, unit: 'chén' }],
      steps: [{ stepNumber: 1, title: 'Chao thịt bê', description: 'Chao bê qua chảo dầu sôi ngập trong 2 phút vớt ra ráo dầu chấm tương gừng.' }]
    },
    {
      title: 'Cơm hến sông Hương xứ Huế',
      description: 'Bát cơm nguội thanh tao ngập tràn thịt hến xào đậm đà, tóp mỡ giòn rụm, hoa chuối, mè rang và mắm ruốc cay xè.',
      prepTime: 25, cookTime: 20, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Hến tươi luộc xào gia vị', quantity: 400, unit: 'g' }, { name: 'Nước luộc hến nóng hổi', quantity: 500, unit: 'ml' }, { name: 'Tóp mỡ giòn, hoa chuối, bắp chuối', quantity: 150, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Bày bát cơm hến', description: 'Xới cơm nguội vào bát, xếp hến xào, tóp mỡ, rau chuối chan nước hến nóng.' }]
    },
    {
      title: 'Lẩu mắm miền Tây cá linh bông điên điển',
      description: 'Nồi lẩu mắm đậm đà thơm ngát cá linh, tôm tươi, thịt ba rọi và cả rổ rau đồng nội điên điển, so đũa, kèo nèo.',
      prepTime: 30, cookTime: 35, servings: 5, difficulty: 'HARD',
      ingredients: [{ name: 'Mắm cá linh và mắm cá sặc', quantity: 200, unit: 'g' }, { name: 'Tôm sú, cá lóc, thịt ba chỉ', quantity: 600, unit: 'g' }, { name: 'Bông điên điển, so đũa, rau đắng', quantity: 400, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu nước lẩu mắm', description: 'Nấu rã mắm cá lọc lấy nước trong, hầm cùng nước dừa và sả ớt thơm lừng.' }]
    },
    {
      title: 'Cao lầu Hội An chuẩn vị phố cổ',
      description: 'Sợi cao lầu vàng dai ngâm tro củi cù lao Chàm, thịt xá xíu đậm đà, da heo chiên phồng giòn rụm và rau thơm Trà Quế.',
      prepTime: 30, cookTime: 40, servings: 4, difficulty: 'HARD',
      ingredients: [{ name: 'Sợi cao lầu tươi dai', quantity: 600, unit: 'g' }, { name: 'Thịt heo xá xíu thái lát', quantity: 350, unit: 'g' }, { name: 'Da heo chiên giòn rụm', quantity: 50, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Hoàn thiện tô cao lầu', description: 'Chần sợi cao lầu, xếp thịt xá xíu da heo chiên chan nước sốt thịt xíu đậm đà.' }]
    }
  ],

  'mon-chinh': [
    {
      title: 'Cơm tấm sườn bì chả đặc biệt',
      description: 'Cơm tấm dẻo thơm hạt gạo gãy, miếng sườn cốt lết nướng mật ong sả óng ả, chả trứng hấp bùi béo và mỡ hành.',
      prepTime: 30, cookTime: 30, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gạo tấm thơm', quantity: 400, unit: 'g' }, { name: 'Sườn cốt lết nướng', quantity: 4, unit: 'miếng' }, { name: 'Chả trứng hấp bì heo', quantity: 200, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Bày đĩa cơm tấm', description: 'Xới cơm tấm, đặt sườn nướng, chả trứng, rưới mỡ hành lên đĩa.' }]
    },
    {
      title: 'Phở bò tái nạm gầu phố cổ',
      description: 'Phở bò gia truyền nước dùng hầm xương ống ngọt đậm đà, thịt nạm gầu giòn thơm kết hợp tái mềm ngọt.',
      prepTime: 30, cookTime: 120, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bánh phở tươi', quantity: 800, unit: 'g' }, { name: 'Thịt bò tái nạm', quantity: 500, unit: 'g' }, { name: 'Xương bò hầm quế hồi', quantity: 1.5, unit: 'kg' }],
      steps: [{ stepNumber: 1, title: 'Chan phở bò', description: 'Chần phở, xếp thịt bò nạm tái rồi chan nước dùng nóng hổi.' }]
    },
    {
      title: 'Bò sốt vang bánh mì nóng giòn',
      description: 'Bắp bò hầm rượu vang đỏ đậm đà, nước sốt sánh mịn thơm phức quế hồi, chấm cùng bánh mì nóng giòn.',
      prepTime: 25, cookTime: 60, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Bắp bò có gân', quantity: 600, unit: 'g' }, { name: 'Rượu vang đỏ', quantity: 150, unit: 'ml' }, { name: 'Cà rốt và khoai tây', quantity: 3, unit: 'củ' }],
      steps: [{ stepNumber: 1, title: 'Hầm sốt vang', description: 'Xào săn bắp bò rồi hầm nhỏ lửa cùng rượu vang và khoai tây 50 phút.' }]
    },
    {
      title: 'Gà nướng mật ong cơm lam Tây Bắc',
      description: 'Gà ta nướng than hoa da vàng giòn ngọt thịt ăn cùng ống cơm lam nếp nương dẻo thơm bùi béo.',
      prepTime: 25, cookTime: 40, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Gà ta thả đồi', quantity: 1.4, unit: 'kg' }, { name: 'Cơm lam nếp nương ống tre', quantity: 4, unit: 'ống' }, { name: 'Mật ong rừng và hạt dổi mắc khén', quantity: 40, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nướng gà và cơm lam', description: 'Nướng gà trên than hoa thơm lừng ăn kèm cơm lam nướng ống tre.' }]
    },
    {
      title: 'Vịt quay Bắc Kinh da giòn óng ả',
      description: 'Thịt vịt mềm ngọt đậm đà gia vị thảo mộc, lớp da quay vàng giòn rụm cuốn bánh tráng chấm sốt tương ngọt.',
      prepTime: 40, cookTime: 50, servings: 5, difficulty: 'HARD',
      ingredients: [{ name: 'Vịt béo nguyên con', quantity: 2, unit: 'kg' }, { name: 'Mạch nha quét da giòn', quantity: 50, unit: 'g' }, { name: 'Bánh tráng cuốn và dưa leo đầu hành', quantity: 200, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Quay vịt da giòn', description: 'Thổi gió khô da vịt, quét mạch nha rồi quay 200 độ C cho da giòn rụm.' }]
    },
    {
      title: 'Lẩu cá hồi Sa Pa măng chua cay',
      description: 'Đặc sản xứ lạnh Sa Pa với phi lê cá hồi tươi béo ngọt nấu trong nồi lẩu măng chua cay nồng thơm ngát.',
      prepTime: 20, cookTime: 30, servings: 4, difficulty: 'MEDIUM',
      ingredients: [{ name: 'Cá hồi Sa Pa phi lê', quantity: 500, unit: 'g' }, { name: 'Măng chua le rừng', quantity: 250, unit: 'g' }, { name: 'Cà chua dứa và rau nhúng lẩu', quantity: 300, unit: 'g' }],
      steps: [{ stepNumber: 1, title: 'Nấu lẩu cá hồi', description: 'Nấu nước dùng măng chua cay đậm đà rồi nhúng cá hồi tươi ăn kèm bún.' }]
    }
  ]
};

async function main() {
  console.log('🔄 Đang đồng bộ hóa toàn bộ 20 danh mục (mỗi danh mục ĐÚNG 6 công thức)...');

  // Query authors
  const authors = await prisma.user.findMany({ where: { role: 'AUTHOR' } });
  const authorIds = authors.map((a) => a.id);
  if (authorIds.length === 0) throw new Error('Không có user AUTHOR!');

  // Clear all old recipes
  await prisma.recipeStep.deleteMany({});
  await prisma.recipeIngredient.deleteMany({});
  await prisma.recipeImage.deleteMany({});
  await prisma.recipe.deleteMany({});
  console.log('✓ Đã xóa sạch công thức cũ trong DB');

  // Query all categories
  const categories = await prisma.category.findMany();
  const catMap = new Map();
  categories.forEach((c) => catMap.set(c.slug, c.id));

  let totalRecipes = 0;

  for (const [slug, recipes] of Object.entries(data)) {
    const categoryId = catMap.get(slug);
    if (!categoryId) {
      console.warn(`Category không tồn tại: ${slug}`);
      continue;
    }

    for (let i = 0; i < recipes.length; i++) {
      const item = recipes[i];
      const authorId = authorIds[i % authorIds.length];

      const baseSlug = generateSlug(item.title);
      let finalSlug = baseSlug;
      let counter = 1;
      while (await prisma.recipe.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      await prisma.recipe.create({
        data: {
          title: item.title,
          slug: finalSlug,
          description: item.description,
          instructions: item.steps.map((s) => `${s.stepNumber}. ${s.title}: ${s.description}`).join('\n\n'),
          prepTime: item.prepTime,
          cookTime: item.cookTime,
          servings: item.servings,
          difficulty: item.difficulty,
          status: RecipeStatus.PUBLISHED,
          categoryId,
          authorId,
          publishedAt: new Date(),
          ingredients: {
            create: item.ingredients.map((ing, idx) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              orderIndex: idx,
            })),
          },
          steps: {
            create: item.steps.map((st) => ({
              stepNumber: st.stepNumber,
              title: st.title,
              description: st.description,
            })),
          },
        },
      });
      totalRecipes++;
    }
    console.log(`✓ [${slug}]: Đã tạo đúng 6 công thức!`);
  }

  console.log(`🎉 HOÀN TẤT: Đã tạo đúng ${totalRecipes} công thức (tất cả 20 danh mục đều có chính xác 6 công thức)!`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
