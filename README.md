# 会津大図書館API

## 概要
会津大学附属図書館の蔵書情報などを取得できるAPIです。
本APIは大学非公式であり、予告なく提供を終了する場合があります。

## 共通仕様
### リクエスト
リクエストはHTTPSプロトコルでJSON形式で送信してください。

### ドメイン名
ドメイン名は`uoa-library-api.kashu.dev`です。

### 認証
現在では認証は必要ありません。ただし、将来的に仕様を変更する可能性があります。

### ステータスコード
ステータスコードは、HTTP status code specification に準拠しています。

### レスポンス
成功すると、JSONとステータスコード`200`を返します。エラー発生時は、該当するエラーコードと、以下の例のようなJSONが返されます。
##### エラーの例
```json
{
  "message": "pageSize is required."
}
```

### 禁止行為
- **大量リクエストの禁止**  
負荷テストや動作テストを目的に、大量のリクエストを送信しないでください。本APIサーバーだけでなく、大学のOPACにも影響を与えます。

## 機能一覧
URL: `https://uoa-library-api.kashu.dev/api/v1`
| エンドポイント | 機能 |
| ---- | ---- |
| /search | [蔵書検索](#蔵書検索) |
| /detail | [蔵書詳細](#蔵書詳細(本のみ対応)) |

### 蔵書検索
**メソッド**: `GET`  
**URL**: `https://uoa-library-api.kashu.dev/api/v1/search`  
**クエリパラメータ**  
| パラメータ | 型 | 説明 | 例 |
| ---- | ---- | ---- | ---- |
| pageSize | number | (必須) 結果の最大数を指定します。| 50 |
| keyword | string | 書名･著者･出版社･番号などから検索します | TOEIC |
| author | string | 著者 | 夏目漱石 |
| title | string | タイトル | LINE API |
| fulltitle | string | タイトル(完全一致) | TOEIC L&R TEST出る単特急金のフレーズ |
| isbn | number | ISBN番号 | 9784023315686 |
| publisher | string | 出版社(社) | オライリー・ジャパン |
| publishyear-start | number | 出版年範囲の開始 | 2000 |
| publishyear-end | number | 出版年範囲の終了 | 2002 |
| subject | string | 件名 | |

**リクエストの例**:  
`https://uoa-library-api.kashu.dev/api/v1/search?pageSize=2&keyword=TOEIC`

**レスポンスの本文**  
成功すると、JSONの配列が返されます。
| フィールド| 型 | 説明 | 例 |
| ---- | ---- | ---- | ---- |
| type | string | 本(book)か雑誌(magazine)| "book" |
| title | string| 本のタイトル | "1駅1題TOEIC L&R test読解特急 : 新形式対応" |
| authors | string | 本の著者(本のみ対応) | "神崎正哉, TEX加藤, Daniel Warriner著" |
| publisher | string | 発行社(者)(本のみ対応) | "朝日新聞出版" |
| series | string | シリーズ(本のみ対応) | "TOEIC L&R TEST読解特急 : 新形式対応 ; 2" |
| journal | string | ジャーナル(雑誌のみ対応) | "The English journal" |
| biblographyId | string | 書誌ID | "1000024510" |
| collections | array | 蔵書情報の配列 | ---- |
| partialResult | boolean| 蔵書情報の配列が一部かどうか。蔵書数が多い場合、すべての蔵書情報が表示されません。このフィールドがtrueの場合、すべての蔵書情報を取得するには、/detailエンドポイントで取得する必要があります。 | false |

collectionsの配列  
| フィールド| 型 | 説明 | 例 |
| ---- | ---- | ----- | ---- |
| volume | string | 巻(本のみ対応) | "2 スピード強化編" |
| location | string | 所在 | "４大:図書館1F:グローバル" |
| requestNumber | string | 請求番号(本のみ対応) | "830.79/K/2" |
| materialId | string | 資料ID(本のみ対応) | "J0063020" |
| condition | string | 本の状態。貸出可能(available)か、貸出中(on-loan)、閲覧のみ(reference-only)で表されます。 | "available" |


**レスポンスの例**
```json
[
    {
        "type": "book",
        "title": "1駅1題TOEIC L&R test読解特急 : 新形式対応",
        "authors": "神崎正哉, TEX加藤, Daniel Warriner著",
        "publisher": "朝日新聞出版",
        "series": "TOEIC L&R TEST読解特急 : 新形式対応 ; 2",
        "biblographyId": "1000024510",
        "collections": [
            {
                "volume": "2 スピード強化編",
                "location": "４大:図書館1F:グローバル",
                "requestNumber": "830.79/K/2",
                "materialId": "J0063020",
                "condition": "available"
            },
            {
                "volume": "5 ダブルパッセージ編",
                "location": "４大:図書館1F:グローバル",
                "requestNumber": "830.79/K/5",
                "materialId": "J0063021",
                "condition": "available"
            }
        ],
        "partialResult": false
    },
    {
    "type": "magazine",
    "title": "TOEIC満点+英検1級をこの一冊で 勝者の英単語160",
    "journal": "The English journal",
    "volume": "Vol.44",
    "biblographyId": "0100001610",
    "collections": [
      {
        "location": "４大",
        "condition": "available"
      }
    ],
    "partialResult": false
  },
]
```

**エラーの例**
| ステータスコード | エラーメッセージ | 説明 |
| ---- | ---- | ---- |
| 400 | pageSize is required. | pageSizeフィールドは必須です。1以上の整数で指定してください。数値が大きいと、レスポンスに時間がかかる場合があります。 |
| 400 | At least one search criteria are required. | 検索条件が指定されていません。１つ以上の検索条件を指定してください。 |


### 蔵書詳細(本のみ対応)
**メソッド**: `GET`  
**URL**: `https://uoa-library-api.kashu.dev/api/v1/detail`  
**クエリパラメータ**  
| パラメータ | 型 | 説明 | 例 |
| ---- | ---- | ---- | ---- |
| biblographyId | string | (必須) 書誌ID| "1000042941" |

**リクエストの例**:  
`https://uoa-library-api.kashu.dev/api/v1/detail?biblographyId=1000042685`

**レスポンスの本文**  
成功すると、JSONの配列が返されます。
| フィールド| 型 | 説明 | 例 |
| ---- | ---- | ---- | ---- |
| biblographyId | string | 書誌ID| "1000042685" |
| title | string| 本のタイトル | "LINE API実践ガイド " |
| type | string | 本(book)| "book" |
| authors | string | 本の著者 | "LINE API Expert認定メンバー著" |
| volumes | array | 巻の配列 | ---- |
| publisher | string | 出版社(者) | "マイナビ出版" |
| publishonDate | string | 出版日 | "2020.10" |
| language | string | 言語("japanese"または"non-japanese") | "japanese" |
| collections | array | 蔵書情報の配列 | ---- |
| partialResult | boolean| 蔵書情報の配列が一部かどうか。蔵書数が多い場合、すべての蔵書情報が表示されません。このフィールドがtrueの場合、すべての蔵書情報を取得するには、/detailエンドポイントで取得する必要があります。 | false |

collectionsの配列  
| フィールド| 型 | 説明 | 例 |
| ---- | ---- | ----- | ---- |
| requestNumber | string | 請求番号 | "547.48/L" |
| materialId | string | 資料ID | "J0065267" |
| volume | string | 巻 | "" |
| location | string | 所在 | "４大 図書館2F 開架和書架" |
| condition | string | 本の状態。貸出可能(available)か、貸出中(on-loan)、閲覧のみ(reference-only)で表されます。 | "on-loan" |
| dueDate | string | 貸出期限。本が貸出中の場合、その貸出期限が入ります。貸出中以外の場合、空となります。 | "2022/10/03" |


**レスポンスの例**
```json
{
    "biblographyId": "1000042685",
    "title": "LINE API実践ガイド ",
    "type": "book",
    "authors": "LINE API Expert認定メンバー著",
    "volumes": [
        {
            "volume": "",
            "isbn": "9784839973766",
            "price": "3630円+税"
        }
    ],
    "publisher": "マイナビ出版",
    "publishonDate": "2020.10",
    "language": "japanese",
    "collections": [
        {
            "requestNumber": "547.48/L",
            "materialId": "J0065267",
            "volume": "",
            "location": "４大 図書館2F 開架和書架",
            "condition": "on-loan",
            "dueDate": "2022/10/03"
        }
    ]
}
```

**エラーの例**
| ステータスコード | エラーメッセージ | 説明 |
| ---- | ---- | ---- |
| 400 | biblographyId is required. | biblographyIdフィールドは必須です。/searchで取得できる書誌IDを使用してください。 |
| 400 | Magazine is not supported. | 雑誌はサポートされていません。 |


