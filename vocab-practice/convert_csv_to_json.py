#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import json
import re

def categorize_vocabulary(chinese_word):
    """根据中文词汇内容进行分类，参考vocab-practice的主题结构"""
    
    # 政治理论与思想 (1-8行)
    if any(keyword in chinese_word for keyword in [
        '马克思主义', '毛泽东思想', '邓小平理论', '三个代表', '科学发展观', 
        '习近平新时代中国特色社会主义思想', '中国特色社会主义', '共产主义',
        '实事求是', '解放思想', '与时俱进', '求真务实'
    ]):
        return "政治理论与思想"
    
    # 战略目标与理念 (9-24行)
    elif any(keyword in chinese_word for keyword in [
        '中国梦', '两个一百年', '中华民族伟大复兴', '新发展理念', '创新', '协调', 
        '绿色', '开放', '共享', '高质量发展', '现代化', '强国', '奋斗目标',
        '以人民为中心', '发展思想', '四个自信', '中国方案', '十四五', '规划',
        '顶层设计', '重要战略机遇期', '新常态', '总体布局'
    ]):
        return "战略目标与理念"
    
    # 政治制度 (25-32行)
    elif any(keyword in chinese_word for keyword in [
        '社会主义民主', '人民代表大会制度', '多党合作', '政治协商', '民族区域自治',
        '基层群众自治', '一国两制', '特别行政区', '人民当家作主', '全国人民代表大会',
        '国务院', '爱国统一战线', '港人治港', '澳人治澳', '祖国内地', '大陆',
        '和平统一', '香港回归', '东方之珠', '台湾海峡', '两岸', '一个中国原则',
        '九二共识', '两岸关系'
    ]):
        return "政治制度"
    
    # 法治建设 (33-40行)
    elif any(keyword in chinese_word for keyword in [
        '全面依法治国', '依法治国', '依法执政', '依法行政', '社会主义法治体系',
        '法治国家', '法治政府', '法治社会', '司法', '宪法', '法律', '司法公正'
    ]):
        return "法治建设"
    
    # 党的建设 (41-65行)
    elif any(keyword in chinese_word for keyword in [
        '中国共产党', '党的领导', '从严治党', '党的建设', '党风廉政', '反腐败',
        '党内监督', '纪律检查', '组织建设', '思想建设', '作风建设', '制度建设',
        '党员', '干部', '基层党组织', '党性', '党纪', '党规', '两个维护',
        '四个意识', '全心全意为人民服务', '不忘初心', '牢记使命', '党的基本理论',
        '党的基本路线', '党的基本方略', '伟大斗争', '伟大工程', '伟大事业', '伟大梦想',
        '党的全面领导', '群众路线', '批评和自我批评'
    ]):
        return "党的建设"
    
    # 价值观与文化 (66-85行)
    elif any(keyword in chinese_word for keyword in [
        '改革创新', '开拓进取', '爱国主义', '集体主义', '社会主义核心价值观',
        '中华优秀传统文化', '革命文化', '社会主义先进文化', '文化自信',
        '精神文明', '思想道德', '理想信念', '价值观', '文化', '中华民族共同体意识',
        '中国精神', '五四运动', '五四精神', '红船精神', '井冈山精神', '长征精神',
        '延安精神', '西柏坡精神', '抗美援朝精神', '两弹一星精神', '特区精神',
        '抗洪精神', '抗震救灾精神', '载人航天精神', '劳模精神', '劳动精神', '工匠精神'
    ]):
        return "价值观与文化"
    
    # 经济发展 (86-100行)
    elif any(keyword in chinese_word for keyword in [
        '公有制经济', '非公有制经济', '国有经济', '集体经济', '私营经济',
        '社会主义市场经济', '供给侧结构性改革', '创新驱动', '实体经济',
        '数字经济', '现代化经济体系', '经济', '市场', '产业', '三大攻坚战',
        '新一轮农村改革', '三农', '自由贸易区', '蓝色伙伴关系'
    ]):
        return "经济发展"
    
    # 区域发展战略 (101-110行)
    elif any(keyword in chinese_word for keyword in [
        '长三角一体化', '黄河流域', '新型城镇化', '京津冀', '粤港澳大湾区',
        '长江经济带', '西部大开发', '东北振兴', '中部崛起', '区域协调发展',
        '长江三角洲', '珠江三角洲', '东北地区全面振兴', '21世纪海上丝绸之路'
    ]):
        return "区域发展战略"
    
    # 社会建设 (111-150行)
    elif any(keyword in chinese_word for keyword in [
        '双循环', '内循环', '外循环', '民生', '社会保障', '就业', '收入分配',
        '脱贫攻坚', '乡村振兴', '社会治理', '公共服务', '社会', '民生保障',
        '养老', '医疗', '住房', '教育公平', '社会公平', '共同富裕', '集中力量办大事',
        '全面建成小康社会', '精准扶贫', '精准脱贫', '人民日益增长的美好生活需要',
        '不平衡不充分的发展', '健康中国', '美好生活', '工人阶级', '农民工', '劳动模范',
        '脱贫', '贫困', '绝对贫困', '贫困地区'
    ]):
        return "社会建设"
    
    # 科技创新 (151-200行)
    elif any(keyword in chinese_word for keyword in [
        '教育公平', '义务教育', '职业教育', '高等教育', '科技创新', '人工智能',
        '大数据', '云计算', '物联网', '区块链', '5G', '互联网', '数字化',
        '智能化', '信息化', '科技', '创新', '技术', '研发', '科技强国',
        '创新型国家', '互联网+', '行动计划', '中国制造2025', '杂交水稻', '中国高铁',
        '中国天眼', '载人航天', '探月工程', '北斗卫星导航系统'
    ]):
        return "科技创新"
    
    # 生态文明 (201-220行)
    elif any(keyword in chinese_word for keyword in [
        '生物多样性', '生态系统', '自然保护区', '碳达峰', '碳中和', '双碳',
        '生态文明', '美丽中国', '绿水青山', '金山银山', '环境保护', '生态',
        '环境', '绿色发展', '可持续发展', '节能减排', '污染防治', '人与自然和谐共生',
        '节能环保', '尊重自然', '顺应自然', '保护自然'
    ]):
        return "生态文明"
    
    # 传统文化艺术
    elif any(keyword in chinese_word for keyword in [
        '粤剧', '木偶戏', '皮影戏', '相声', '锣鼓', '中国杂技', '中国陶瓷',
        '中国书法', '国画', '中国山水画', '中国人物画', '中国花鸟画', '唐诗', '宋词',
        '四大名著', '红楼梦', '水浒传', '三国演义', '西游记', '西厢记', '牡丹亭',
        '四书五经', '论语', '易经', '诗经', '史记', '四大发明', '四大书院',
        '四大名绣', '文房四宝', '宣纸', '四大菜系', '中国剪纸', '春联', '中国结',
        '唐三彩', '汉字', '文言文', '繁体字', '六艺', '八仙', '牛郎织女', '孟姜女',
        '梁山伯与祝英台', '白蛇传', '孙子兵法', '三十六计', '孔子', '老子', '孟子', '庄子', '诸子百家',
        '程朱理学', '天人合一', '五行学说', '阴阳学说', '京剧', '昆曲', '甲骨文',
        '郑和下西洋', '秦始皇', '炎黄子孙'
    ]):
        return "传统文化艺术"
    
    # 传统节日习俗
    elif any(keyword in chinese_word for keyword in [
        '春节', '端午节', '元宵节', '中秋节', '清明节', '重阳节', '农历',
        '十二生肖', '二十四节气', '天干地支'
    ]):
        return "传统节日习俗"
    
    # 中医药文化
    elif any(keyword in chinese_word for keyword in [
        '中医', '针灸', '黄帝内经', '本草纲目'
    ]):
        return "中医药文化"
    
    # 地理名胜
    elif any(keyword in chinese_word for keyword in [
        '长江', '黄河', '长城', '故宫', '颐和园', '圆明园', '苏州园林', '拙政园',
        '敦煌莫高窟', '都江堰水利工程', '京杭大运河', '少林寺', '喜马拉雅山脉',
        '珠穆朗玛峰', '秦岭', '青藏高原', '黄土高原', '塔里木盆地', '泰山',
        '布达拉宫', '四合院', '祠堂'
    ]):
        return "地理名胜"
    
    # 传统哲学思想
    elif any(keyword in chinese_word for keyword in [
        '宋明理学', '五行', '阴和阳', '科举制度'
    ]):
        return "传统哲学思想"
    
    # 传统体育武术
    elif any(keyword in chinese_word for keyword in [
        '中国象棋', '中国武术', '中国功夫', '太极拳'
    ]):
        return "传统体育武术"
    
    # 精神品质
    elif any(keyword in chinese_word for keyword in [
        '两弹一星', '女排精神', '钉钉子精神', '企业家精神', '丝路精神', '精神'
    ]):
        return "精神品质"
    
    # 社会治理
    elif any(keyword in chinese_word for keyword in [
        '智慧城市', '一票否决', '治大国若烹小鲜'
    ]):
        return "社会治理"
    
    # 文化建设 (221-280行)
    elif any(keyword in chinese_word for keyword in [
        '绿色生活', '节约资源', '循环利用', '传统文化', '民族文化', '地方文化',
        '工业文化', '商业文化', '城市文化', '乡村文化', '校园文化', '企业文化',
        '军营文化', '网络文化', '青年文化', '老年文化', '儿童文化', '妇女文化',
        '残疾人文化', '外来文化', '多元文化', '文化交流', '文化合作', '文化传播',
        '文化影响力', '软实力', '话语权', '文化走出去', '讲好中国故事', '传播中国声音',
        '展示中国形象', '孔子学院'
    ]):
        return "文化建设"
    
    # 国际关系 (281-300行)
    elif any(keyword in chinese_word for keyword in [
        '构建人类命运共同体', '新型国际关系', '合作共赢', '互利共赢', '开放包容',
        '交流互鉴', '和平发展', '共同发展', '一带一路', '外交', '国际', '全球',
        '世界', '多边', '联合国', '全球治理', '国际合作', '和平共处五项原则',
        '大国关系', '南北对话', '南北差距', '民间交流', '人文交流', '丝绸之路',
        '海上丝绸之路', '利益共同体', '人类命运共同体'
    ]):
        return "国际关系"
    
    # 发展理念 (301-318行)
    elif any(keyword in chinese_word for keyword in [
        '可持续发展', '创新发展', '协调发展', '绿色发展', '开放发展', '共享发展',
        '高质量发展', '全面发展', '均衡发展', '包容性发展', '韧性发展', '安全发展',
        '健康发展', '稳定发展', '持续发展', '快速发展', '跨越式发展', '转型发展',
        '融合发展', '一体化发展', '差异化发展', '特色发展', '优质发展', '内涵式发展',
        '外延式发展', '集约发展', '精细化发展', '专业化发展', '规模化发展', '产业化发展',
        '市场化发展', '国际化发展', '信息化发展', '智能化发展', '自动化发展', '现代化发展'
    ]):
        return "发展理念"
    
    # 历史文化传统
    elif any(keyword in chinese_word for keyword in [
        '鸦片战争', '辛亥革命', '中国人民抗日战争', '解放战争', '中国人民解放军',
        '中国人民志愿军', '抗美援朝战争', '义勇军进行曲', '革命老区', '南昌起义',
        '历史', '古代', '遗产', '典籍', '先贤', '文明', '近代', '现代', '革命',
        '建设', '改革开放', '新中国', '中华民族', '民族精神', '时代精神', '红色',
        '英雄', '先烈'
    ]):
        return "历史文化传统"
    
    # 军事国防
    elif any(keyword in chinese_word for keyword in [
        '军事', '国防', '军队', '武装', '战争', '和平', '安全', '防务',
        '军民融合', '退役军人', '军人', '士兵', '将军', '海洋强国'
    ]):
        return "军事国防"
    
    # 荣誉奖励
    elif any(keyword in chinese_word for keyword in [
        '勋章', '奖章', '荣誉', '表彰', '嘉奖', '奖励', '称号', '模范',
        '先进', '优秀', '杰出', '突出', '卓越', '功勋', '七一勋章'
    ]):
        return "荣誉奖励"
    
    # 民族文化
    elif any(keyword in chinese_word for keyword in [
        '民族', '族群', '多民族', '民族团结', '民族文化', '少数民族', '汉族',
        '民族区域自治', '民族政策', '民族关系', '民族复兴', '侨胞', '华人', '华侨'
    ]):
        return "民族文化"
    
    # 青年教育
    elif any(keyword in chinese_word for keyword in [
        '青年', '学生', '教育', '学校', '大学', '高等教育', '职业教育', '义务教育',
        '素质教育', '德育', '智育', '体育', '美育', '劳动教育', '思想政治教育',
        '少年', '先锋队', '学习'
    ]):
        return "青年教育"
    
    # 默认分类
    else:
        return "综合概念"

def convert_csv_to_json():
    """
    将CSV文件转换为JSON格式，并添加分类信息
    """
    vocabulary_data = []
    
    with open('300.csv', 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.reader(csvfile)
        # 跳过第一行标题
        next(csv_reader)
        
        for line_num, row in enumerate(csv_reader, start=2):
            if len(row) >= 2:
                chinese = row[0].strip()
                english = row[1].strip()
                
                if chinese and english:
                    # 获取分类
                    category = categorize_vocabulary(chinese)
                    
                    vocabulary_item = {
                        "id": line_num - 1,
                        "chinese": chinese,
                        "english": english,
                        "category": category,
                        "status": "unknown"  # 默认学习状态
                    }
                    
                    vocabulary_data.append(vocabulary_item)
    
    # 按分类统计
    category_stats = {}
    for item in vocabulary_data:
        category = item['category']
        category_stats[category] = category_stats.get(category, 0) + 1
    
    # 创建最终的JSON结构
    result = {
        "metadata": {
            "total_count": len(vocabulary_data),
            "categories": category_stats,
            "created_at": "2024-10-13",
            "version": "1.0"
        },
        "vocabulary": vocabulary_data
    }
    
    # 保存为JSON文件
    with open('vocabulary.json', 'w', encoding='utf-8') as jsonfile:
        json.dump(result, jsonfile, ensure_ascii=False, indent=2)
    
    print(f"成功转换 {len(vocabulary_data)} 个词汇到 vocabulary.json")
    print("\n分类统计:")
    for category, count in sorted(category_stats.items()):
        print(f"  {category}: {count} 个")
    
    return result

if __name__ == "__main__":
    convert_csv_to_json()