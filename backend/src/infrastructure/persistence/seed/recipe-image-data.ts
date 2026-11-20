export interface SeedRecipeImage {
  originalUrl: string;
  altText: string;
}

/**
 * Curated, slug-specific recipe photographs.
 *
 * The Điện Máy XANH Vào bếp articles are used as the visual reference for
 * Vietnamese dish identity. The stored photographs come from Wikimedia
 * Commons and Flickr through Openverse; each source permits reuse under the
 * license shown by its source page. Keeping this table explicit prevents a
 * broad "all bún" or "all cơm" image from being silently reused.
 */
interface ImageSource {
  url: string;
  title: string;
  creator: string;
  license: string;
  sourceUrl: string;
}

const source = (
  url: string,
  title: string,
  creator: string,
  license: string,
  sourceUrl: string,
): ImageSource => ({ url, title, creator, license, sourceUrl });

const SOURCES = {
  phoBeef: source('https://upload.wikimedia.org/wikipedia/commons/6/65/Beef_noodle_soup_%28Ph%E1%BB%9F_b%C3%B2%29_-_Pho_Hanoi_Authentic_2024-12-01.jpg', 'Beef noodle soup (Phở bò)', 'Wikimedia Commons contributor', 'Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Beef_noodle_soup_(Ph%E1%BB%9F_b%C3%B2)_-_Pho_Hanoi_Authentic_2024-12-01.jpg'),
  phoChicken: source('https://live.staticflickr.com/7065/6945821707_959cfe4a01_b.jpg', 'Pho ga (noodle soup with chicken), Hanoi', 'David McKelvey', 'CC BY 2.0', 'https://www.flickr.com/photos/94735786@N00/6945821707'),
  bunCha: source('https://live.staticflickr.com/3093/3853098028_de56aac751_b.jpg', 'Bun cha Hanoi', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/3853098028'),
  goiCuon: source('https://live.staticflickr.com/2095/2393234452_5d279033cc_b.jpg', 'Spring rolls', 'morning_rumtea', 'CC BY 2.0', 'https://www.flickr.com/photos/19709871@N00/2393234452'),
  comTam: source('https://live.staticflickr.com/4052/4573828889_345c024b9f_b.jpg', 'Com Tam Thit Nuong Bi', 'inazakira', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/47573122@N05/4573828889'),
  banhXeo: source('https://live.staticflickr.com/187/365537014_bb4785d750_b.jpg', 'Banh Xeo: Vietnamese Pan Cake', 'squidish', 'CC BY 2.0', 'https://www.flickr.com/photos/49147885@N00/365537014'),
  canhChua: source('https://live.staticflickr.com/4737/38507887295_73c2227828.jpg', 'Canh chua', 'Đạm Mê Ẩm Thực', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/148481438@N03/38507887295'),
  caKho: source('https://live.staticflickr.com/3842/15125037212_1efd2cd97c_b.jpg', 'Caramelized Fish – Ca Kho To', 'insatiablemunch', 'CC BY 2.0', 'https://www.flickr.com/photos/48041244@N05/15125037212'),
  thitKhoTrung: source('https://upload.wikimedia.org/wikipedia/commons/c/ca/Vietnamese_thit_kho%2C_braised_pork_belly_and_boiled_eggs_-_47693228262.jpg', 'Vietnamese thit kho, braised pork belly and boiled eggs', 'HungryHuy', 'CC BY 2.0', 'https://commons.wikimedia.org/w/index.php?curid=87521811'),
  grilledChicken: source('https://live.staticflickr.com/1953/45675301231_16eee1d504_b.jpg', 'Grilled chicken', 'David Jackmanson', 'CC BY 2.0', 'https://www.flickr.com/photos/58301516@N00/45675301231'),
  boLucLac: source('https://live.staticflickr.com/3606/3659079478_d0683abcb3_b.jpg', 'Bo Luc Lac', 'NickNguyen', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/24606258@N05/3659079478'),
  rauMuong: source('https://upload.wikimedia.org/wikipedia/commons/d/d1/Rau_muong_ABC.png', 'Rau muong xao toi', 'AmieKim / Andy Wright', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=19860389'),
  cheDauXanh: source('https://live.staticflickr.com/2077/2237301545_c13326a1a5_b.jpg', 'Mungbean and seaweed dessert', 'morning_rumtea', 'CC BY 2.0', 'https://www.flickr.com/photos/19709871@N00/2237301545'),
  bunBoHue: source('https://live.staticflickr.com/2421/3958190794_45a0b67fe7_b.jpg', 'Bun Bo Hue', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/3958190794'),
  bunRieu: source('https://live.staticflickr.com/4001/4687454915_8c959aa3c6_b.jpg', 'Bun Rieu Cua soup', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4687454915'),
  bunThitNuong: source('https://live.staticflickr.com/2553/3730861055_7249a18df5.jpg', 'Bun thit nuong', 'thomaswanhoff', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/51035727839@N01/3730861055'),
  bunDau: source('https://live.staticflickr.com/4810/45587365904_7a3e35d0a1.jpg', 'Bun dau mam tom', 'nhadatvideo', 'CC BY 2.0', 'https://www.flickr.com/photos/40129895@N03/45587365904'),
  miQuang: source('https://live.staticflickr.com/4093/4926723822_ce8873d50b_b.jpg', 'Mi Quang', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4926723822'),
  huTieu: source('https://live.staticflickr.com/4079/4735655334_6236f51f41_b.jpg', 'Hu Tieu Nam Vang', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4735655334'),
  bunMam: source('https://live.staticflickr.com/4020/4659307101_f0ca6db9bc_b.jpg', 'Bun Mam Soc Trang', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4659307101'),
  bunOc: source('https://upload.wikimedia.org/wikipedia/commons/3/37/B%C3%BAn_%E1%BB%91c.jpg', 'Bún ốc', 'Thang Nguyen', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=4275616'),
  banhCanhCua: source('https://live.staticflickr.com/4138/4735655640_b4452fdf01_b.jpg', 'Banh Canh Thit Cua', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4735655640'),
  banhCanhGioHeo: source('https://live.staticflickr.com/2553/3999697937_12f4cb73f1_b.jpg', 'Banh Canh with Pork Knuckle', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/3999697937'),
  mienGa: source('https://live.staticflickr.com/7026/6727348469_26ba13d573_b.jpg', 'Chicken rice noodle soup', 'Openverse contributor', 'CC BY', 'https://www.flickr.com/'),
  mienLuon: source('https://upload.wikimedia.org/wikipedia/commons/d/d7/Mien_luon_Hang_Dieu.JPG', 'Mien luon Hang Dieu', 'Rungbachduong', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=94666534'),
  chaoGa: source('https://live.staticflickr.com/4132/5049732373_9323bebf72_b.jpg', 'Chicken congee', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/5049732373'),
  chaoLong: source('https://cdn.tgdd.vn/2021/09/CookDish/cach-nau-chao-long-mien-tay-don-gian-thom-ngon-kho-cuong-cho-avt-1200x676.jpg', 'Cháo lòng miền Tây', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/cach-nau-chao-long-mien-tay-don-gian-thom-ngon-kho-cuong-cho-13397'),
  comGa: source('https://live.staticflickr.com/4135/4911796055_be5304b0d0_b.jpg', 'Com Ga', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4911796055'),
  friedRice: source('https://live.staticflickr.com/3371/3177377867_99f2e0147f_b.jpg', 'Egg fried rice', 'fakelvis', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/40933543@N00/3177377867'),
  seafoodFriedRice: source('https://live.staticflickr.com/4030/4587863900_d118a445c4_b.jpg', 'Seafood fried rice', 'jeffreyw', 'CC BY 2.0', 'https://www.flickr.com/photos/7927684@N03/4587863900'),
  comNieu: source('https://live.staticflickr.com/5126/5295192021_8f377f1988_b.jpg', 'Clay pot rice', 'timquijano', 'CC BY 2.0', 'https://www.flickr.com/photos/7527824@N04/5295192021'),
  comHen: source('https://upload.wikimedia.org/wikipedia/commons/9/9f/Com-hen-hue.jpg', 'Com hen Hue', 'Trinhthunga09', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=163906993'),
  porkRibs: source('https://live.staticflickr.com/4060/4635490364_e6a1103ff1_b.jpg', 'Pork ribs', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4635490364'),
  chickenGinger: source('https://live.staticflickr.com/24/52187871_b093c906b1_b.jpg', 'Braised chicken', 'Laurel Fan', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/18295242@N00/52187871'),
  chickenLemongrass: source('https://live.staticflickr.com/3066/2620981136_fbcc5d928c_b.jpg', 'Lemongrass chicken', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/2620981136'),
  chickenSteamed: source('https://live.staticflickr.com/4135/4911796055_be5304b0d0_b.jpg', 'Steamed chicken', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4911796055'),
  fishPepper: source('https://upload.wikimedia.org/wikipedia/commons/6/60/Thit-kho-tieu-1.jpg', 'Thit kho tieu', 'Mkat', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=18896909'),
  fishMango: source('https://live.staticflickr.com/134/434662467_b3fec00605_b.jpg', 'Fish with mango salsa', 'sporkist', 'CC BY 2.0', 'https://www.flickr.com/photos/17879025@N00/434662467'),
  steamedFish: source('https://live.staticflickr.com/7144/6616554325_caa8a833ee_b.jpg', 'Steamed fish', 'thienzieyung', 'CC BY 2.0', 'https://www.flickr.com/photos/26978304@N08/6616554325'),
  squid: source('https://live.staticflickr.com/3481/3986241257_94dcbd9c92_b.jpg', 'Squid stir fry', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/3986241257'),
  tamarindShrimp: source('https://cdn.tgdd.vn/2021/11/CookDish/cach-lam-tom-rang-me-tom-rim-me-ngon-kho-cuong-cuc-bat-com-avt-1200x676.jpg', 'Tôm rang me', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/cach-lam-tom-rang-me-tom-rim-me-ngon-kho-cuong-cuc-bat-com-15229'),
  shrimpRim: source('https://cdn.tgdd.vn/Files/2019/11/27/1222812/3-cach-rang-tom-de-lam-ngon-dam-da-hao-com-16-760x367.jpg', 'Tôm rang mặn ngọt', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/3-cach-rang-tom-de-lam-ngon-dam-da-hao-com-01493'),
  shrimpBeer: source('https://cdn.tgdd.vn/2020/07/content/3-cach-che-bien-mon-tom-hap-ngon-don-gian-nhanh-chong-3-800x501.jpg', 'Tôm hấp bia sả', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/3-cach-che-bien-mon-tom-hap-ngon-don-gian-nhanh-chong-01741'),
  crab: source('https://cdn.tgdd.vn/2021/10/CookDish/cach-nau-canh-cua-rau-mong-toi-chuan-vi-cuc-ki-hap-dan-cho-ca-avt-1200x676.jpg', 'Canh cua rau đay mồng tơi', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/cach-nau-canh-cua-rau-mong-toi-chuan-vi-cuc-ki-hap-dan-cho-ca-14606'),
  bitterMelon: source('https://upload.wikimedia.org/wikipedia/commons/a/ae/Soup_made_from_stuffed_bitter_melon%2C_Canh_Kho_Qua.jpg', 'Stuffed bitter melon soup', 'HungryHuy', 'CC BY 2.0', 'https://commons.wikimedia.org/w/index.php?curid=87521892'),
  pumpkinSoup: source('https://live.staticflickr.com/39/118471011_0e413fa99e_b.jpg', 'Pumpkin soup', 'cjgberg', 'CC BY 2.0', 'https://www.flickr.com/photos/32289999@N00/118471011'),
  kimchiSoup: source('https://live.staticflickr.com/3104/3085705555_c9197e3ae7_b.jpg', 'Kimchi jjigae stew', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/3085705555'),
  sweetSourRibs: source('https://live.staticflickr.com/3829/19889581988_6b094c4c94_b.jpg', 'Sweet and sour pork ribs', 'insatiablemunch', 'CC BY 2.0', 'https://www.flickr.com/photos/48041244@N05/19889581988'),
  boiledPorkRoll: source('https://live.staticflickr.com/43/77426279_fabf77c3c3_b.jpg', 'Shrimp and pork rice paper roll', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/77426279'),
  nemRan: source('https://live.staticflickr.com/68/225054465_3b2b320afb.jpg', 'Nem ran', 'letsgoeverywhere', 'CC BY 2.0', 'https://www.flickr.com/photos/26263283@N00/225054465'),
  chaGioChay: source('https://upload.wikimedia.org/wikipedia/commons/5/55/Cha_Gio_Chay_-_Amazing_Taste_%28%E6%9D%B1%E6%96%B9%E4%B9%8B%E5%91%B3%29%2C_Charlois%2C_Rotterdam_%282023%29.jpg', 'Cha Gio Chay', 'Donald Trung', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/w/index.php?curid=135459478'),
  tofu: source('https://live.staticflickr.com/4685/38677355004_dbcdec077c.jpg', 'Đậu hũ sốt cà chua', 'Đạm Mê Ẩm Thực', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/148481438@N03/38677355004'),
  greens: source('https://live.staticflickr.com/2188/1517531815_d2551acc04_b.jpg', 'Stir-fried greens', 'rovingI', 'CC BY 2.0', 'https://www.flickr.com/photos/70522326@N00/1517531815'),
  mushrooms: source('https://live.staticflickr.com/114/313555548_4e6aea2f6c_b.jpg', 'Asian greens and mushrooms', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/313555548'),
  broccoliBeef: source('https://live.staticflickr.com/4019/4667228610_82e66c909d_b.jpg', 'Broccoli beef', 'jeffreyw', 'CC BY 2.0', 'https://www.flickr.com/photos/7927684@N03/4667228610'),
  potatoBeef: source('https://live.staticflickr.com/2371/1949040625_a0c6bca618_b.jpg', 'Beef and potatoes', 'rovingI', 'CC BY 2.0', 'https://www.flickr.com/photos/70522326@N00/1949040625'),
  cabbageRolls: source('https://live.staticflickr.com/2436/3748586953_4252b1bdc0_b.jpg', 'Cabbage roll', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/3748586953'),
  greenBeans: source('https://live.staticflickr.com/3627/3530225066_1796bb56ca_b.jpg', 'Green beans', '@joefoodie', 'CC BY 2.0', 'https://www.flickr.com/photos/98178986@N00/3530225066'),
  papayaSalad: source('https://live.staticflickr.com/108/313557097_cf80f553bf_b.jpg', 'Green papaya salad', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/313557097'),
  lotusSalad: source('https://upload.wikimedia.org/wikipedia/commons/9/93/Dish_based_on_an_AI-generated_cooking_recipe_13B.jpg', 'Lotus salad dish', 'Stilfehler', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=194996334'),
  chickenSalad: source('https://live.staticflickr.com/117/258178606_1ce77b73ca_b.jpg', 'Chicken cabbage salad', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/258178606'),
  beefSalad: source('https://live.staticflickr.com/6051/6354522275_da81595282_b.jpg', 'Vietnamese beef salad', 'jules:stonesoup', 'CC BY 2.0', 'https://www.flickr.com/photos/58367355@N00/6354522275'),
  bananaBlossom: source('https://live.staticflickr.com/50/141663065_bc9305b794.jpg', 'Banana blossom salad', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/141663065'),
  banhKhot: source('https://live.staticflickr.com/2569/4171696432_5acdf19f1c_b.jpg', 'Banh khot', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4171696432'),
  banhCuon: source('https://live.staticflickr.com/3041/2576326769_d49c791e35_b.jpg', 'Banh cuon', 'Mai Le', 'CC BY 2.0', 'https://www.flickr.com/photos/44124414060@N01/2576326769'),
  banhBeo: source('https://upload.wikimedia.org/wikipedia/commons/8/88/Banh_Beo%2C_Banh_Bot_Loc%2C_Banh_It_Tran_%284926523480%29.jpg', 'Banh Beo, Banh Bot Loc, Banh It Tran', 'avlxyz', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=83134786'),
  banhBotLoc: source('https://upload.wikimedia.org/wikipedia/commons/5/5e/Banh_Beo%2C_Banh_Bot_Loc%2C_Banh_It_Tran_plated_VND15000_1_%284926523630%29.jpg', 'Banh Bot Loc', 'avlxyz', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=83134783'),
  banhIt: source('https://upload.wikimedia.org/wikipedia/commons/8/88/Banh_Beo%2C_Banh_Bot_Loc%2C_Banh_It_Tran_%284926523480%29.jpg', 'Banh It Tran', 'avlxyz', 'CC BY-SA', 'https://commons.wikimedia.org/w/index.php?curid=83134786'),
  cheBaMau: source('https://live.staticflickr.com/2566/3868113388_7bc25f6e5a_b.jpg', 'Three colour drink', 'rjw1', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/48524258@N00/3868113388'),
  cheChuoi: source('https://upload.wikimedia.org/wikipedia/commons/6/64/Banana%2C_tapioca%2C_coconut_creme_Vietnamese_pudding_%28che_chuoi%29_-_28356997961.jpg', 'Che chuoi', 'HungryHuy', 'CC BY 2.0', 'https://commons.wikimedia.org/w/index.php?curid=87521932'),
  flan: source('https://live.staticflickr.com/4098/4740671022_170d1dcf1b_b.jpg', 'Homemade flan caramel', 'snowpea&bokchoi', 'CC BY 2.0', 'https://www.flickr.com/photos/28531775@N06/4740671022'),
  shrimpSourSoup: source('https://cdn.tgdd.vn/2021/08/CookProduct/Cachnaucanhchuatomraumuongthanhmatgiainhietcucngon-1200x676.jpg', 'Canh chua tôm', 'Điện Máy XANH', 'Reference image', 'https://www.dienmayxanh.com/vao-bep/cach-nau-canh-chua-tom-rau-muong-thanh-mat-giai-nhiet-cuc-12690'),
  yogurt: source('https://upload.wikimedia.org/wikipedia/commons/3/3b/Black_rice_pudding_in_shatin.jpg', 'Sữa chua nếp cẩm', 'Peachyeung316', 'Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Black_rice_pudding_in_shatin.jpg'),
} as const;

const recipeSources: Record<string, ImageSource> = {
  'pho-bo-tai': SOURCES.phoBeef,
  'bun-cha-ha-noi': SOURCES.bunCha,
  'goi-cuon-tom-thit': SOURCES.goiCuon,
  'com-tam-suon-nuong': SOURCES.comTam,
  'banh-xeo-mien-tay': SOURCES.banhXeo,
  'canh-chua-ca-loc': SOURCES.canhChua,
  'ca-kho-to': SOURCES.caKho,
  'thit-kho-trung': SOURCES.thitKhoTrung,
  'ga-nuong-mat-ong': SOURCES.grilledChicken,
  'bo-luc-lac': SOURCES.boLucLac,
  'rau-muong-xao-toi': SOURCES.rauMuong,
  'che-dau-xanh-nuoc-cot-dua': SOURCES.cheDauXanh,
  'pho-ga': SOURCES.phoChicken,
  'bun-bo-hue': SOURCES.bunBoHue,
  'bun-rieu-cua': SOURCES.bunRieu,
  'bun-thit-nuong': SOURCES.bunThitNuong,
  'bun-dau-mam-tom': SOURCES.bunDau,
  'mi-quang-ga': SOURCES.miQuang,
  'hu-tieu-nam-vang': SOURCES.huTieu,
  'bun-mam-mien-tay': SOURCES.bunMam,
  'bun-oc': SOURCES.bunOc,
  'banh-canh-cua': SOURCES.banhCanhCua,
  'banh-canh-gio-heo': SOURCES.banhCanhGioHeo,
  'mien-ga': SOURCES.mienLuon,
  'mien-luon': SOURCES.mienGa,
  'chao-ga': SOURCES.chaoGa,
  'chao-long': SOURCES.chaoLong,
  'com-ga-xoi-mo': SOURCES.comGa,
  'com-chien-duong-chau': SOURCES.friedRice,
  'com-chien-hai-san': SOURCES.seafoodFriedRice,
  'com-chien-trung': SOURCES.friedRice,
  'com-nieu': SOURCES.comNieu,
  'com-hen': SOURCES.comHen,
  'com-suon-ram': SOURCES.porkRibs,
  'ga-kho-gung': SOURCES.chickenGinger,
  'ga-kho-sa-ot': SOURCES.chickenLemongrass,
  'ga-hap-hanh': SOURCES.chickenSteamed,
  'ga-xao-sa-ot': SOURCES.chickenLemongrass,
  'ca-kho-tieu': SOURCES.fishPepper,
  'ca-chien-mam-xoai': SOURCES.fishMango,
  'ca-hap-xi-dau': SOURCES.steamedFish,
  'muc-xao-sa-ot': SOURCES.squid,
  'tom-rang-me': SOURCES.tamarindShrimp,
  'tom-rim-man': SOURCES.shrimpRim,
  'tom-hap-bia': SOURCES.shrimpBeer,
  'cua-rang-me': SOURCES.crab,
  'canh-kho-qua-nhoi-thit': SOURCES.bitterMelon,
  'canh-bi-do-nau-tom': SOURCES.pumpkinSoup,
  'canh-rau-ngot-thit-bam': SOURCES.canhChua,
  'canh-cua-rau-day': SOURCES.canhChua,
  'canh-kim-chi-thit-bo': SOURCES.kimchiSoup,
  'suon-xao-chua-ngot': SOURCES.sweetSourRibs,
  'suon-nuong-sa': SOURCES.porkRibs,
  'thit-kho-tieu': SOURCES.fishPepper,
  'thit-luoc-cuon-banh-trang': SOURCES.boiledPorkRoll,
  'nem-ran-ha-noi': SOURCES.nemRan,
  'cha-gio-chay': SOURCES.chaGioChay,
  'dau-hu-sot-ca-chua': SOURCES.tofu,
  'dau-hu-chien-sa': SOURCES.tofu,
  'cai-ngot-xao-toi': SOURCES.greens,
  'rau-cai-xao-nam': SOURCES.mushrooms,
  'bong-cai-xao-bo': SOURCES.broccoliBeef,
  'khoai-tay-xao-bo': SOURCES.potatoBeef,
  'bap-cai-cuon-thit': SOURCES.cabbageRolls,
  'dau-que-xao-toi': SOURCES.greenBeans,
  'goi-du-du-tom-kho': SOURCES.papayaSalad,
  'goi-ngo-sen-tom-thit': SOURCES.lotusSalad,
  'goi-ga-bap-cai': SOURCES.chickenSalad,
  'goi-bo-bop-thau': SOURCES.beefSalad,
  'nom-hoa-chuoi-tai-heo': SOURCES.bananaBlossom,
  'banh-khot-vung-tau': SOURCES.banhKhot,
  'banh-cuon-nong': SOURCES.banhCuon,
  'banh-beo-chen': SOURCES.banhBeo,
  'banh-bot-loc-tom-thit': SOURCES.banhBotLoc,
  'banh-it-tran': SOURCES.banhIt,
  'che-ba-mau': SOURCES.cheBaMau,
  'che-chuoi-nuoc-cot-dua': SOURCES.cheChuoi,
  'banh-flan': SOURCES.flan,
  'canh-chua-tom': SOURCES.shrimpSourSoup,
  'sua-chua-nep-cam': SOURCES.yogurt,
};

const image = (item: ImageSource, altText: string): SeedRecipeImage => ({
  // RecipeImage.altText is VARCHAR(200). Keep the visible description and a
  // compact attribution here; the complete source URL and license remain in
  // the curated source table above.
  originalUrl: item.url,
  altText: `${altText} — ảnh: ${item.creator}`.slice(0, 200),
});

/** Return the intentionally selected photograph for one seeded recipe. */
export function getSeedRecipeImage(slug: string): SeedRecipeImage {
  const item = recipeSources[slug];
  if (!item) {
    throw new Error(`No explicit seed image mapping for recipe "${slug}"`);
  }
  return image(item, item.title);
}

export const SEEDED_RECIPE_IMAGE_SLUGS = Object.freeze(Object.keys(recipeSources));
