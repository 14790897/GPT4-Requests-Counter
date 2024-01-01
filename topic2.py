import jieba
from langdetect import detect
import jieba.analyse
import json
import logging

# 创建一个logger对象
logger = logging.getLogger()
logger.setLevel(logging.INFO)  # 你可以设置为DEBUG, INFO, ERROR等不同的日志级别

# from sklearn.feature_extraction.text import TfidfVectorizer


def extract_keywords(text):
    try:

        language = detect(text)  # 检测文本的语言
        logger.info(f"Detected language: {language}")
        # if language == 'zh-cn' or language == 'zh-tw':  # 如果文本是中文
        keywords = jieba.analyse.extract_tags(text, topK=20, withWeight=True, allowPOS=())
        # else:  # 如果文本是英文或其他语言
        #     vectorizer = TfidfVectorizer()
        #     tfidf_matrix = vectorizer.fit_transform([text])
        #     feature_names = vectorizer.get_feature_names_out()
        #     org_keywords = [feature_names[i] for i in tfidf_matrix.sum(axis=0).argsort()[0, -10:]]
        #     keywords = org_keywords[0][0].tolist()

        return keywords
    except Exception as e:
        logger.error(f"Error in extract_keywords: {e}")
        raise e


# 使用函数
# keywords = extract_keywords(text)
# print(keywords)

def find_paragraph(text, keyword):
    try:

        paragraphs = text.split('\n')  # 假设段落由换行符分隔
        for i, paragraph in enumerate(paragraphs):
            if keyword in paragraph:
                extended_paragraph = paragraph
                prev_idx, next_idx = i - 1, i + 1
    
                # 扩展段落直到长度达到100个字
                while len(extended_paragraph) < 300:
                    # 向前扩展
                    if prev_idx >= 0:
                        extended_paragraph = paragraphs[prev_idx] + extended_paragraph
                        prev_idx -= 1
    
                    # 如果长度仍小于100个字，向后扩展
                    if len(extended_paragraph) < 100 and next_idx < len(paragraphs):
                        extended_paragraph += paragraphs[next_idx]
                        next_idx += 1
    
                    # 如果已经是第一段或最后一段，停止扩展
                    if prev_idx < 0 and next_idx >= len(paragraphs):
                        break
    
                return extended_paragraph
    
        return None
    except Exception as e:
        logger.error(f"Error in find_paragraph: {e}")
        raise e

def lambda_handler(event, context):
    try:

        headers = {
            "Access-Control-Allow-Origin": "*",  # 允许所有源的访问，你也可以指定某个特定的源
            "Access-Control-Allow-Credentials": "true",  # 如果需要，允许凭据（例如cookies）
            "Access-Control-Allow-Headers": "Content-Type",  # 允许的请求头
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",  # 允许的HTTP方法
            "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header",
            "Access-Control-Expose-Headers": "X-My-Custom-Header",
            "Access-Control-Max-Age": "86400"  # 24小时
    
    
        }
        
            # 检查是否是OPTIONS请求，如果是，则直接返回允许CORS的头
        http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
        if http_method == 'OPTIONS':
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"message": "CORS configuration successful"}),
            }
            
        try:
            # 解析 body 字段中的 JSON 字符串
            body = json.loads(event["body"])
        except (KeyError, json.JSONDecodeError):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps(
                    {
                        "error": "Missing or invalid JSON body",
                        "event": event,
                        # 'body': body
                    }
                ),
            }
            
       
    
        if "text" not in body:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing text parameter"}),
            }
    
        text = body["text"]
        top_keyword = None
        paragraph = None
        keywords = extract_keywords(text)
          # 找到权重最高的关键词
        top_keyword = max(keywords, key=lambda x: x[1])[0] if keywords else None
         # 如果找到了关键词，定位它所在的段落
        if top_keyword:
            paragraph = find_paragraph(text, top_keyword)
            
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
            "keywords": keywords,
            "top_keyword": top_keyword,
            "paragraph": paragraph
            }),
        }
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": "Internal server error"}),
    }

