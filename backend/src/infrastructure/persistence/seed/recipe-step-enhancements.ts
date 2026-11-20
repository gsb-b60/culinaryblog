import type { SeedStep } from './recipe-data.js';

type StepDraft = [title: string, description: string, timerMinutes?: number];

const detail = (...drafts: StepDraft[]): SeedStep[] =>
  drafts.map(([title, description, timerMinutes]) => ({
    title,
    description,
    ...(timerMinutes === undefined ? {} : { timerMinutes }),
  }));

/**
 * Extra, recipe-specific preparation stages for the extended Vietnamese catalog.
 *
 * The compact seed records intentionally keep the main recipe definition readable;
 * these stages add the practical cues a cook needs without making every recipe
 * follow the same three-step template.
 */
export const RECIPE_STEP_ENHANCEMENTS: Record<string, SeedStep[]> = {
  'pho-ga': detail(
    ['Làm sạch gà', 'Xát gà với muối, rửa sạch rồi chần nhanh để nước luộc sau đó trong hơn.'],
    [
      'Nướng hành gừng',
      'Nướng hành tây và gừng đến khi vỏ cháy xém nhẹ; đây là phần tạo mùi thơm đặc trưng cho nước phở.',
    ],
    [
      'Hớt bọt',
      'Trong 20 phút đầu, liên tục hớt bọt và giữ nồi chỉ sôi lăn tăn để nước dùng không bị đục.',
    ],
  ),
  'bun-bo-hue': detail(
    [
      'Chần thịt',
      'Chần bắp bò và giò heo trong nước sôi, rửa sạch máu đông rồi mới cho vào nồi hầm.',
    ],
    [
      'Pha mắm ruốc',
      'Hòa mắm ruốc với nước ấm, để lắng và lọc lấy phần nước trong để vị mắm tròn mà không lợn cợn.',
    ],
    ['Làm sa tế', 'Phi sả băm với dầu điều và ớt, giữ một phần sa tế để thêm vào từng tô khi ăn.'],
  ),
  'bun-rieu-cua': detail(
    ['Lọc cua lần hai', 'Lọc nước cua qua rây mịn thêm một lần và để riêng phần gạch cua nếu có.'],
    [
      'Để riêu đóng mảng',
      'Khi nước cua bắt đầu sôi, hạ lửa và khuấy một chiều rất nhẹ để riêu kết thành mảng, không bị vỡ.',
    ],
  ),
  'bun-thit-nuong': detail(
    [
      'Làm nước ướp',
      'Giã sả, tỏi và hành tím rồi trộn với nước mắm, mật ong và dầu hào để thịt có mùi thơm sâu hơn.',
    ],
    [
      'Ngâm đồ chua',
      'Ngâm cà rốt và củ cải trong giấm đường ít nhất 20 phút; vắt ráo trước khi cho vào tô bún.',
    ],
    [
      'Kiểm tra thịt',
      'Miếng thịt đạt khi cạnh xém vàng, phần giữa không còn màu hồng sống nhưng vẫn còn nước thịt.',
    ],
  ),
  'bun-dau-mam-tom': detail(
    [
      'Chuẩn bị bún',
      'Cắt bún lá thành miếng vừa gắp và để trên rổ cho ráo, tránh làm mắm tôm bị loãng.',
    ],
    [
      'Chiên đậu đúng độ',
      'Thấm khô đậu phụ rồi chiên từng mặt đến vàng giòn; không xếp chồng khi vớt ra để đậu giữ độ giòn.',
    ],
  ),
  'mi-quang-ga': detail(
    [
      'Nấu nước dùng ít',
      'Mì Quảng chỉ cần lượng nước rim vừa đủ ngập khoảng một phần ba sợi mì, không nấu như bún nước.',
    ],
    [
      'Rang đậu phộng',
      'Rang đậu phộng lửa nhỏ đến khi vỏ nứt và có mùi thơm, để nguội mới giã để đậu không bị dính dầu.',
    ],
  ),
  'hu-tieu-nam-vang': detail(
    [
      'Nướng xương',
      'Chần xương, rửa sạch và nướng sơ hành tây trước khi hầm để nước dùng có vị ngọt và mùi thơm rõ hơn.',
    ],
    ['Lọc nước dùng', 'Hầm lửa nhỏ, hớt bọt thường xuyên rồi lọc qua khăn mỏng trước khi nêm.'],
    [
      'Trụng từng phần',
      'Trụng hủ tiếu theo từng tô, không ngâm lâu trong nồi vì sợi sẽ nở và mất độ dai.',
    ],
  ),
  'bun-mam-mien-tay': detail(
    [
      'Lọc mắm',
      'Nấu mắm cá với một ít nước rồi lọc qua rây, bỏ xương và xác để nước lèo có vị đậm nhưng mịn.',
    ],
    [
      'Nêm vị dịu',
      'Thêm nước dừa và đường từng ít một; vị mắm ngon phải đậm ở đầu lưỡi nhưng không gắt ở hậu vị.',
    ],
    [
      'Nấu hải sản sau cùng',
      'Cho cá, tôm và mực vào theo thứ tự cá trước, tôm sau, mực cuối cùng để hải sản không bị dai.',
    ],
  ),
  'bun-oc': detail(
    ['Ngâm ốc', 'Ngâm ốc với nước vo gạo và vài lát ớt, thay nước đến khi ốc nhả hết bùn.'],
    [
      'Lấy thịt ốc',
      'Luộc vừa chín, lấy thịt và bóp nhẹ với muối; không luộc quá lâu vì ốc sẽ bị dai.',
    ],
  ),
  'banh-canh-cua': detail(
    ['Nấu nước nền', 'Hầm xương gà với hành, vớt bọt và lọc lấy nước trong trước khi cho cua vào.'],
    [
      'Khuấy bột năng',
      'Hòa bột năng với nước lạnh, rót thành dòng mỏng và khuấy liên tục để nước dùng sánh đều, không vón cục.',
    ],
  ),
  'banh-canh-gio-heo': detail(
    [
      'Chần giò heo',
      'Chần giò trong nước sôi có gừng, rửa lại thật sạch rồi mới hầm để nước dùng trong và không hôi.',
    ],
    [
      'Giữ nước dùng trong',
      'Hầm ở lửa nhỏ, chỉ để mặt nước rung nhẹ; sôi mạnh sẽ làm nước đục và làm giò nát.',
    ],
  ),
  'mien-ga': detail(
    [
      'Ngâm miến',
      'Ngâm miến dong trong nước ấm vừa đủ mềm, không ngâm quá lâu vì miến còn tiếp tục nở khi chan nước dùng.',
    ],
    [
      'Xào măng nấm',
      'Xào măng và nấm với một ít nước mắm trước khi cho vào nồi để phần nhân thơm và đậm hơn.',
    ],
  ),
  'mien-luon': detail(
    [
      'Khử mùi lươn',
      'Bóp lươn với muối và chanh, rửa sạch nhớt rồi luộc cùng một nhánh gừng trước khi gỡ thịt.',
    ],
    [
      'Chiên lươn',
      'Để thịt lươn thật ráo rồi mới áo bột; dầu đủ nóng sẽ làm lớp ngoài giòn mà không hút nhiều dầu.',
    ],
  ),
  'chao-ga': detail(
    [
      'Rang gạo',
      'Rang gạo tẻ và gạo nếp trên chảo khô đến khi hơi vàng và thơm, cháo sau đó sẽ có vị bùi hơn.',
    ],
    [
      'Khuấy cháo',
      'Nấu lửa nhỏ và khuấy đáy nồi mỗi vài phút để gạo không bén, thêm nước nóng nếu cháo đặc trước khi hạt nở hết.',
    ],
  ),
  'chao-long': detail(
    [
      'Làm sạch lòng',
      'Rửa từng phần lòng với muối và chanh, lộn mặt nếu cần rồi xả nhiều lần trước khi luộc.',
    ],
    [
      'Luộc riêng từng loại',
      'Luộc gan, tim, dạ dày và lòng theo thời gian khác nhau; vớt phần vừa chín vào nước đá để giữ độ giòn.',
    ],
    [
      'Rang gạo',
      'Rang gạo đến khi vàng nhẹ rồi mới nấu với nước xương, tránh rang quá tay làm cháo có vị khét.',
    ],
  ),
  'com-ga-xoi-mo': detail(
    [
      'Luộc gà vừa chín',
      'Luộc đến khi xiên vào phần dày nhất chỉ thấy nước trong, sau đó ngâm gà vào nước lạnh để da săn.',
    ],
    [
      'Làm khô da',
      'Thấm khô đùi gà và phết lớp gia vị mỏng trước khi chiên; da càng khô thì càng giòn và ít bắn dầu.',
    ],
  ),
  'com-chien-duong-chau': detail(
    [
      'Làm tơi cơm',
      'Dùng cơm nguội để lạnh qua đêm hoặc hong khô trước khi chiên; bóp tơi các cục cơm bằng tay sạch.',
    ],
    [
      'Xào từng phần',
      'Xào lạp xưởng, tôm và rau củ riêng, múc ra rồi mới chiên cơm để chảo luôn đủ nóng.',
    ],
  ),
  'com-chien-hai-san': detail(
    [
      'Thấm khô hải sản',
      'Thấm tôm và mực thật khô để khi cho vào chảo không tiết nhiều nước làm cơm nhão.',
    ],
    [
      'Chiên cơm lửa lớn',
      'Đảo cơm liên tục trên lửa lớn đến khi hạt rời và săn, sau đó mới cho hải sản đã xào trở lại.',
    ],
  ),
  'com-chien-trung': detail(
    [
      'Chuẩn bị cơm nguội',
      'Tách cơm thành hạt rời trước khi bật bếp; cơm còn ấm hoặc vón cục sẽ khó đạt độ khô tơi.',
    ],
    [
      'Áo trứng cho cơm',
      'Đổ trứng đã đánh vào chảo nóng, cho cơm vào ngay và đảo nhanh để trứng bám mỏng quanh từng hạt cơm.',
    ],
  ),
  'com-nieu': detail(
    [
      'Ngâm gạo',
      'Ngâm gạo 15 phút rồi để ráo để hạt cơm chín đều từ trong ra ngoài khi nấu trong niêu đất.',
    ],
    [
      'Hạ lửa đúng lúc',
      'Khi mặt cơm vừa cạn nước, hạ lửa thật nhỏ và đậy kín; mở nắp nhiều lần sẽ làm cơm lâu chín.',
    ],
  ),
  'com-hen': detail(
    [
      'Đãi hến',
      'Luộc hến, đãi thịt trong nước luộc và lọc nước qua rây để bỏ cát trước khi dùng kèm cơm.',
    ],
    [
      'Làm tóp mỡ',
      'Rán mỡ lửa nhỏ đến khi vàng giòn, vớt ra để ráo rồi dùng phần mỡ đó xào hến cho thơm.',
    ],
  ),
  'com-suon-ram': detail(
    [
      'Ướp sườn',
      'Sau khi chần, để sườn thật ráo rồi trộn với một ít nước mắm, tiêu và hành tỏi để thịt có vị đậm trước khi ram.',
    ],
    [
      'Thắng nước màu',
      'Đun đường đến màu cánh gián rồi tắt bếp trước khi thêm nước nóng, tránh để đường cháy đắng.',
    ],
  ),
  'ga-kho-gung': detail(
    [
      'Ướp thịt gà',
      'Chặt gà thành miếng vừa ăn, ướp với nước mắm, tiêu và gừng trong ít nhất 20 phút để thịt đậm từ bên trong.',
    ],
    [
      'Xào săn trước khi kho',
      'Xào gà đến khi mặt ngoài se lại rồi mới thêm nước; thịt sẽ giữ được độ ngọt và không bị bở.',
    ],
  ),
  'ga-kho-sa-ot': detail(
    [
      'Băm sả đúng độ',
      'Dùng phần non của sả, băm nhỏ một nửa và đập dập một nửa để vừa có mùi thơm vừa có sả trong nước kho.',
    ],
    [
      'Kho cạn sốt',
      'Khi gà chín, mở nắp và rim thêm vài phút để nước kho bám quanh thịt thay vì loãng dưới đáy nồi.',
    ],
  ),
  'ga-hap-hanh': detail(
    [
      'Để gà ráo',
      'Sau khi ướp, đặt gà lên xửng vài phút cho bề mặt ráo; hơi nước sẽ làm da gà không bị nhão.',
    ],
    [
      'Kiểm tra phần đùi',
      'Dùng que xiên vào phần dày nhất, nếu nước chảy ra trong và không còn màu hồng là gà đã chín.',
    ],
  ),
  'ga-xao-sa-ot': detail(
    [
      'Thái gà ngang thớ',
      'Thái ức gà ngang thớ thành lát mỏng để thịt mềm, sau đó trộn với một ít dầu giúp thịt không khô khi xào.',
    ],
    [
      'Xào rau sau cùng',
      'Ớt chuông và hành tây chỉ cần vừa chín tới; cho vào sau khi gà gần chín để rau vẫn giòn và có màu đẹp.',
    ],
  ),
  'ca-kho-tieu': detail(
    [
      'Làm sạch cá',
      'Xát cá với muối và gừng, rửa nhanh rồi thấm khô để cá bớt tanh và không làm loãng nước ướp.',
    ],
    [
      'Không đảo cá nhiều',
      'Trong lúc kho chỉ nghiêng nồi và múc nước rưới lên mặt cá; dùng đũa đảo sẽ làm khúc cá vỡ.',
    ],
  ),
  'ca-chien-mam-xoai': detail(
    [
      'Hong cá',
      'Khứa cá, xát muối rồi thấm thật khô; để cá ngoài không khí 10 phút trước khi chiên giúp da giòn hơn.',
    ],
    [
      'Pha mắm xoài',
      'Nêm nước mắm xoài theo vị chua ngọt trước khi rưới lên cá, tránh rưới quá sớm làm lớp da mất giòn.',
    ],
  ),
  'ca-hap-xi-dau': detail(
    [
      'Khứa cá',
      'Khứa hai bên thân cá đến gần xương để hơi nóng vào đều và phần thịt dày chín cùng lúc.',
    ],
    [
      'Chắt nước hấp',
      'Sau khi cá chín, chắt phần nước tiết ra rồi mới rưới xì dầu; cách này giữ sốt đậm và không bị tanh.',
    ],
  ),
  'muc-xao-sa-ot': detail(
    [
      'Làm sạch mực',
      'Rút mai, bỏ túi mực và rửa nhanh với nước muối loãng, sau đó khứa vảy rồng để mực cuộn đẹp khi xào.',
    ],
    [
      'Xào thật nhanh',
      'Chần mực vài giây rồi xào lửa lớn; vừa săn lại thì cho rau củ vào, nấu lâu sẽ làm mực dai.',
    ],
  ),
  'tom-rang-me': detail(
    [
      'Ướp tôm nhẹ',
      'Rửa tôm, cắt râu và bỏ chỉ lưng; chỉ ướp một ít tiêu để vị chua ngọt của sốt me vẫn nổi bật.',
    ],
    [
      'Cô sốt me',
      'Nấu cốt me với đường đến khi hơi sánh trước, khi cho tôm vào sốt sẽ bám đều mà không cần thêm bột.',
    ],
  ),
  'tom-rim-man': detail(
    ['Để tôm ráo', 'Tôm ráo nước sẽ săn nhanh khi rim và không làm nước sốt bị loãng.'],
    [
      'Rim đến khi áo sốt',
      'Đảo nhẹ đến khi vỏ tôm bóng và nước rim chỉ còn một lớp mỏng bám quanh tôm, không rim khô cứng.',
    ],
  ),
  'tom-hap-bia': detail(
    [
      'Chuẩn bị hơi thơm',
      'Đập dập sả và gừng, dàn đều dưới xửng để hơi bia mang mùi thơm lên tôm.',
    ],
    [
      'Không hấp quá lâu',
      'Tôm vừa chuyển đỏ cam và thân cong nhẹ là đạt; hấp thêm lâu sẽ làm thịt khô và bở.',
    ],
  ),
  'cua-rang-me': detail(
    [
      'Sơ chế cua an toàn',
      'Chần cua trong nước đá vài phút để dễ tháo dây, làm sạch mang và đập dập càng cho sốt thấm vào thịt.',
    ],
    [
      'Chiên cua trước',
      'Chiên nhanh các mặt cua trước khi áo sốt để thịt săn, sau đó chỉ đảo sốt vừa đủ để không làm cua khô.',
    ],
  ),
  'canh-kho-qua-nhoi-thit': detail(
    [
      'Khử vị đắng',
      'Bỏ ruột khổ qua, ngâm trong nước muối loãng rồi xả sạch; không cần chần lâu vì sẽ làm mất màu xanh.',
    ],
    [
      'Nhồi vừa tay',
      'Nhồi nhân vừa đầy và chừa khoảng trống ở hai đầu để nhân nở mà không làm khổ qua nứt khi nấu.',
    ],
  ),
  'canh-bi-do-nau-tom': detail(
    [
      'Xào tôm lấy vị ngọt',
      'Giã hoặc băm tôm, phi cùng hành tím đến khi thơm rồi mới thêm nước để nước canh có vị ngọt tự nhiên.',
    ],
    [
      'Cho bí đúng lúc',
      'Cho miếng bí vào khi nước sôi và nấu vừa mềm; bí nát sẽ làm nước canh đục và ngọt gắt.',
    ],
  ),
  'canh-rau-ngot-thit-bam': detail(
    [
      'Chuẩn bị rau ngót',
      'Tuốt lá, rửa sạch rồi vò nhẹ rau ngót để rau mềm và tiết vị ngọt, nhưng không vò nát thành bã.',
    ],
    [
      'Đun sôi lại',
      'Sau khi cho rau vào, chờ nồi sôi trở lại rồi nêm nước mắm; tắt bếp khi rau vừa chuyển xanh đậm.',
    ],
  ),
  'canh-cua-rau-day': detail(
    [
      'Lọc cua kỹ',
      'Lọc cua qua rây hai lần, dùng tay bóp phần bã với nước để lấy hết vị ngọt nhưng không để vỏ vụn rơi vào nồi.',
    ],
    [
      'Cho rau theo thứ tự',
      'Cho mướp trước, sau đó là rau đay và mồng tơi; rau chỉ cần vừa chín để giữ độ nhớt tự nhiên.',
    ],
  ),
  'canh-kim-chi-thit-bo': detail(
    [
      'Xào kim chi đủ chín',
      'Xào kim chi đến khi mềm và thơm, nước kim chi bám dầu thì nước canh sẽ có màu đỏ đẹp hơn.',
    ],
    [
      'Thả bò cuối cùng',
      'Thịt bò thái mỏng chỉ cần nhúng trong nước sôi vài chục giây; nấu lâu sẽ làm thịt dai.',
    ],
  ),
  'suon-xao-chua-ngot': detail(
    [
      'Sơ chế sườn',
      'Chần sườn với vài lát gừng, vớt ra để ráo rồi áo bột mỏng để khi xào sốt vẫn giữ được lớp ngoài săn.',
    ],
    [
      'Cân bằng sốt',
      'Nếm sốt trước khi cho sườn vào: vị chua, ngọt và mặn cần rõ nhưng không lấn át vị thịt.',
    ],
  ),
  'suon-nuong-sa': detail(
    [
      'Dần sườn',
      'Dùng sống dao dần nhẹ phần thịt dày và khứa vài đường sát xương để gia vị thấm mà sườn không bị co khi nướng.',
    ],
    [
      'Phết sốt nhiều lần',
      'Nướng hai mặt gần chín rồi phết sốt, tránh phết mật ong ngay từ đầu vì đường dễ cháy trước khi thịt chín.',
    ],
  ),
  'thit-kho-tieu': detail(
    [
      'Chuẩn bị thịt',
      'Cắt thịt thành khối có cả nạc và mỡ, ướp với nước mắm, đường và hành để vị thấm đều trong từng miếng.',
    ],
    [
      'Kho hai giai đoạn',
      'Đun sôi nhanh lúc đầu để thịt săn, sau đó hạ lửa và kho chậm đến khi mỡ trong, nước sốt sánh.',
    ],
  ),
  'thit-luoc-cuon-banh-trang': detail(
    [
      'Sơ chế nồi luộc',
      'Cho thịt vào nồi khi nước còn lạnh cùng hành và gừng, đun vừa sôi rồi hớt bọt để thịt chín thơm.',
    ],
    [
      'Làm nguội thịt',
      'Ngâm thịt chín vào nước lạnh vài phút rồi để ráo; thịt sẽ săn và thái lát đẹp hơn.',
    ],
  ),
  'nem-ran-ha-noi': detail(
    [
      'Vắt nhân thật ráo',
      'Miến và mộc nhĩ sau khi ngâm phải vắt ráo, nếu nhân quá ướt bánh sẽ bục khi rán.',
    ],
    [
      'Cuốn lỏng vừa',
      'Cuốn nem vừa tay, chừa một khoảng nhỏ ở hai đầu để nhân nở và vỏ không bị căng rách.',
    ],
    [
      'Rán hai lần',
      'Rán lần đầu lửa vừa cho nhân chín, để nem nghỉ rồi rán lần hai lửa lớn để vỏ vàng giòn.',
    ],
  ),
  'cha-gio-chay': detail(
    [
      'Xào nhân khô',
      'Xào nấm và rau củ đến khi bay bớt nước rồi để nguội mới trộn với đậu phụ; nhân khô sẽ dễ cuốn hơn.',
    ],
    [
      'Để ráo sau khi chiên',
      'Vớt chả giò lên rack hoặc giấy thấm dầu, không xếp chồng ngay để vỏ giữ độ giòn.',
    ],
  ),
  'dau-hu-sot-ca-chua': detail(
    [
      'Ép đậu',
      'Ép nhẹ đậu hũ giữa hai lớp khăn sạch vài phút để khi áp chảo không bị bắn dầu và sốt dễ bám.',
    ],
    [
      'Nấu cà chua nhừ',
      'Xào cà chua đến khi mềm và ra màu đỏ, thêm ít nước rồi mới cho đậu vào om để sốt không còn vị sống.',
    ],
  ),
  'dau-hu-chien-sa': detail(
    ['Thấm khô đậu', 'Thấm đậu hũ trước khi chiên giúp mặt đậu vàng đều và giảm bắn dầu.'],
    [
      'Áo sả sau cùng',
      'Phi sả đến vàng thơm rồi mới cho nước tương và đường, đảo đậu nhẹ tay để sả bám mà đậu không vỡ.',
    ],
  ),
  'cai-ngot-xao-toi': detail(
    [
      'Tách cọng và lá',
      'Cắt cọng cải thành đoạn ngắn, để riêng lá vì cọng cần thêm thời gian nhưng lá chỉ cần đảo nhanh.',
    ],
    [
      'Giữ rau giòn',
      'Xào trên lửa lớn và không đậy nắp; hơi nước nhiều sẽ làm cải chuyển màu và mềm nhũn.',
    ],
  ),
  'rau-cai-xao-nam': detail(
    [
      'Sơ chế nấm',
      'Ngâm nấm đến mềm, vắt ráo rồi thái lát; nấm ráo sẽ thơm hơn khi tiếp xúc với chảo nóng.',
    ],
    [
      'Chần cải',
      'Chần cải thìa trong nước sôi có muối khoảng một phút rồi để ráo, như vậy rau giữ màu và xào nhanh hơn.',
    ],
  ),
  'bong-cai-xao-bo': detail(
    [
      'Ướp bò với dầu',
      'Trộn bò với dầu hào, tiêu và một ít dầu ăn; dầu giúp lát bò mềm khi áp chảo lửa lớn.',
    ],
    [
      'Chần bông cải',
      'Chần bông cải vừa chuyển xanh đậm rồi ngâm nước lạnh, tránh xào lâu làm rau mất độ giòn.',
    ],
  ),
  'khoai-tay-xao-bo': detail(
    [
      'Ngâm khoai',
      'Ngâm khoai đã cắt trong nước muối loãng để bớt tinh bột, sau đó lau khô trước khi áp chảo.',
    ],
    [
      'Áp chảo riêng',
      'Áp chảo khoai gần chín rồi múc ra; xào bò riêng và trộn lại sau cùng để khoai không bị nát.',
    ],
  ),
  'bap-cai-cuon-thit': detail(
    [
      'Chần lá cải',
      'Chần từng lá trong nước sôi cho mềm, vớt ra ngâm lạnh rồi lau khô để lá dễ cuộn và không rách.',
    ],
    [
      'Xếp cuộn trong xửng',
      'Đặt mép cuộn xuống dưới và xếp sát nhau để cuộn không bung khi hấp, nhưng chừa khoảng cho hơi nước lưu thông.',
    ],
  ),
  'dau-que-xao-toi': detail(
    ['Tước xơ đậu', 'Bẻ hai đầu và kéo bỏ sợi xơ, cắt khúc đều nhau để đậu chín cùng lúc.'],
    [
      'Xào với ít nước',
      'Thêm một thìa nước và đậy nắp ngắn lúc đầu để đậu mềm bên trong, sau đó mở nắp xào khô lại với tỏi.',
    ],
  ),
  'goi-du-du-tom-kho': detail(
    [
      'Giữ đu đủ giòn',
      'Bào đu đủ thành sợi, ngâm nước đá rồi vắt thật ráo; đu đủ ướt sẽ làm nước trộn nhạt.',
    ],
    [
      'Giã nước trộn',
      'Giã tỏi và ớt trước, thêm đường rồi mới khuấy với nước mắm và chanh để vị cay thơm hòa đều.',
    ],
  ),
  'goi-ngo-sen-tom-thit': detail(
    [
      'Giữ ngó sen giòn',
      'Ngó sen sau khi tước cần ngâm trong nước chanh loãng và đá để giữ màu trắng, sau đó vắt thật ráo.',
    ],
    [
      'Thái thịt mỏng',
      'Luộc thịt vừa chín, để nguội hoàn toàn rồi thái lát mỏng để khi trộn không bị nát.',
    ],
  ),
  'goi-ga-bap-cai': detail(
    [
      'Làm nguội gà',
      'Luộc gà vừa chín, ngâm nước lạnh rồi để ráo trước khi xé; thịt sẽ trắng và không bị khô.',
    ],
    [
      'Giảm vị hăng hành',
      'Ngâm hành tây thái mỏng trong nước đá 5 phút, vắt ráo rồi mới trộn để hành giòn và dịu.',
    ],
  ),
  'goi-bo-bop-thau': detail(
    [
      'Sơ chế chuối xanh',
      'Thái chuối và khế thật mỏng, ngâm ngay trong nước chanh loãng để chuối không thâm và bớt chát.',
    ],
    [
      'Áp chảo bò nhanh',
      'Chảo phải thật nóng; áp chảo từng mẻ trong thời gian ngắn để thịt có cạnh xém nhưng bên trong còn mềm.',
    ],
  ),
  'nom-hoa-chuoi-tai-heo': detail(
    [
      'Thái hoa chuối',
      'Thái hoa chuối thật mỏng và thả ngay vào nước chanh muối, sau đó rửa sạch và vắt ráo để không bị thâm.',
    ],
    [
      'Làm tai heo giòn',
      'Luộc tai heo đến chín, ngâm nước đá rồi để lạnh trước khi thái sợi; tai sẽ giòn và dễ thái đều.',
    ],
  ),
  'banh-khot-vung-tau': detail(
    [
      'Để bột nghỉ',
      'Khuấy bột với nước cốt dừa rồi để nghỉ, sau đó khuấy lại trước mỗi lần đổ để bột không lắng đáy.',
    ],
    [
      'Làm nóng khuôn',
      'Khuôn phải nóng và có đủ dầu trước khi đổ bột; nghe tiếng xèo là dấu hiệu viền bánh sẽ giòn.',
    ],
    [
      'Lấy bánh đúng lúc',
      'Đậy nắp đến khi tôm chín và mặt bánh se, sau đó mở nắp để hơi nước thoát trước khi lấy bánh ra.',
    ],
  ),
  'banh-cuon-nong': detail(
    [
      'Xào nhân khô',
      'Xào thịt và mộc nhĩ đến khi phần nước bay hết, nhân khô sẽ không làm bánh cuốn bị rách.',
    ],
    [
      'Tráng lớp mỏng',
      'Múc một vá bột, xoay nhanh để phủ kín mặt vải; bánh đạt khi mặt bánh trong và tự bong mép.',
    ],
    [
      'Cuộn khi còn nóng',
      'Đặt nhân lên bánh ngay khi vừa lấy khỏi nồi, cuộn nhẹ tay để bánh không bị khô và gãy.',
    ],
  ),
  'banh-beo-chen': detail(
    [
      'Lắng bột',
      'Để bột nghỉ cho lắng, chắt phần nước phía trên rồi thêm lượng nước mới tương đương để bánh có độ dai mềm.',
    ],
    [
      'Hấp tạo hõm',
      'Rót bột mỏng vào chén đã làm nóng, hấp đến khi mặt bánh trong và giữa bánh lõm nhẹ để giữ topping.',
    ],
    [
      'Làm tôm cháy',
      'Giã tôm khô, rang lửa nhỏ đến khi tơi thơm; không rang quá lửa vì tôm sẽ bị đắng.',
    ],
  ),
  'banh-bot-loc-tom-thit': detail(
    [
      'Nêm và để nguội nhân',
      'Rim tôm và thịt với nước mắm, đường và tiêu đến khi nước cạn, để nguội hoàn toàn trước khi gói.'
    ],
    [
      'Nhào bột nóng',
      'Rót nước sôi từng ít một vào bột năng, dùng đũa trộn trước rồi mới nhào bằng tay đến khi bột dẻo mịn.',
    ],
    [
      'Nặn bánh',
      'Cán một miếng bột mỏng, đặt nhân vào giữa và ép kín mép; mép hở sẽ làm bánh đầy nước khi hấp.',
    ],
    [
      'Hấp bánh',
      'Xếp bánh lên lá chuối đã quét dầu, hấp đến khi vỏ trong và dai; để bánh nghỉ vài phút trước khi gỡ.',
    ],
  ),
  'banh-it-tran': detail(
    [
      'Làm nhân đậu',
      'Nấu đậu xanh thật mềm, tán nhuyễn rồi sên với tôm thịt đến khi nhân khô, có thể vo thành viên.',
    ],
    [
      'Bọc nhân',
      'Lấy phần bột vừa đủ, ấn mỏng giữa lòng bàn tay, đặt nhân vào và miết kín không để lọt khí.',
    ],
    [
      'Làm nguội và hoàn thiện',
      'Luộc từng mẻ trong nước sôi; khi bánh nổi lên, đợi thêm một phút rồi vớt vào nước lạnh để mặt bánh săn.',
    ],
  ),
  'che-ba-mau': detail(
    [
      'Ngâm đậu',
      'Ngâm riêng đậu đỏ và đậu xanh, vo sạch rồi nấu từng loại để cả hai mềm nhưng không bị nát.',
    ],
    [
      'Nấu thạch lá dứa',
      'Xay lá dứa với nước, lọc lấy nước xanh rồi nấu cùng bột rau câu và đường trước khi đổ khuôn.',
    ],
    [
      'Nấu trân châu',
      'Nhào bột năng với nước nóng, vo viên nhỏ rồi luộc đến khi nổi; xả qua nước lạnh để viên không dính.',
    ],
    [
      'Xếp ly',
      'Xếp đậu đỏ, đậu xanh, thạch và trân châu thành từng lớp, thêm đá bào rồi rưới nước cốt dừa khi dùng.',
    ],
  ),
  'che-chuoi-nuoc-cot-dua': detail(
    [
      'Sơ chế chuối',
      'Bóc chuối, cắt khúc và ướp với một ít đường cùng muối để chuối đậm vị mà không bị nát khi nấu.',
    ],
    [
      'Nấu bột báng riêng',
      'Luộc bột báng đến khi trong phần lõi, xả nước lạnh rồi mới cho vào nồi chè để nước không bị đục.',
    ],
  ),
  'banh-flan': detail(
    [
      'Chuẩn bị caramel',
      'Đun đường đến màu hổ phách, lắc nhẹ khuôn cho caramel phủ đáy rồi để nguội bớt trước khi rót trứng.',
    ],
    [
      'Lọc hỗn hợp',
      'Khuấy trứng nhẹ tay với sữa ấm, không đánh tạo bọt; lọc qua rây hai lần để bánh mịn.',
    ],
    [
      'Kiểm soát hơi hấp',
      'Hấp lửa nhỏ và phủ khăn dưới nắp để nước không nhỏ lên mặt bánh; bánh đạt khi giữa còn rung nhẹ.',
    ],
  ),
  'canh-chua-tom': detail(
    [
      'Nấu cốt me',
      'Dầm me với nước ấm, lọc bỏ hạt rồi nêm một ít đường trước khi cho vào nồi để vị chua dịu.',
    ],
    [
      'Cho rau theo thứ tự',
      'Cho dứa và cà chua vào trước, tôm vào khi nước sôi, rau muống và giá chỉ thêm ở phút cuối để còn giòn.',
    ],
  ),
  'sua-chua-nep-cam': detail(
    [
      'Ngâm nếp cẩm',
      'Ngâm nếp cẩm ít nhất 4 giờ hoặc qua đêm, vo nhẹ rồi để ráo trước khi nấu để hạt nở đều.',
    ],
    [
      'Sên đến độ sánh',
      'Nấu nếp với lá dứa đến khi hạt mềm, thêm đường và nước cốt dừa rồi sên đến khi hỗn hợp sánh nhưng vẫn còn hạt.',
    ],
    [
      'Làm lạnh',
      'Để nếp cẩm nguội hoàn toàn trước khi cho lên sữa chua; nếp nóng sẽ làm sữa chua bị tách nước.',
    ],
  ),
};

export function addRecipeStepDetails(slug: string, steps: SeedStep[]): SeedStep[] {
  const extras = RECIPE_STEP_ENHANCEMENTS[slug];
  if (!extras) return steps;
  return [steps[0]!, ...extras, ...steps.slice(1)];
}
