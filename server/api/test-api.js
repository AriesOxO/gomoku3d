/**
 * API 端点测试
 * 测试所有 RESTful API 端点
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 辅助函数：发送 HTTP 请求
function request(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('开始 API 端点测试');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // 测试 1: 获取玩家战绩 - 存在的玩家
    console.log('测试 1: 获取玩家战绩 (存在的玩家)');
    try {
      const res1 = await request('/api/players/测试玩家A/stats');
      if (res1.statusCode === 200 && res1.data.success) {
        console.log('✅ 通过 - 状态码:', res1.statusCode);
        console.log('   玩家:', res1.data.data.name);
        console.log('   总局数:', res1.data.data.total_games);
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res1.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 2: 获取玩家战绩 - 不存在的玩家
    console.log('测试 2: 获取玩家战绩 (不存在的玩家)');
    try {
      const res2 = await request('/api/players/不存在的玩家/stats');
      if (res2.statusCode === 404 && !res2.data.success) {
        console.log('✅ 通过 - 正确返回 404');
        console.log('   错误信息:', res2.data.error.message);
        passedTests++;
      } else {
        console.log('❌ 失败 - 应该返回 404');
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 3: 获取玩家对局历史
    console.log('测试 3: 获取玩家对局历史');
    try {
      const res3 = await request('/api/players/测试玩家A/games?limit=5');
      if (res3.statusCode === 200 && res3.data.success) {
        console.log('✅ 通过 - 状态码:', res3.statusCode);
        console.log('   对局数量:', res3.data.data.games.length);
        console.log('   limit:', res3.data.data.limit);
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res3.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 4: 获取对局详情
    console.log('测试 4: 获取对局详情');
    try {
      const res4 = await request('/api/games/1');
      if (res4.statusCode === 200 && res4.data.success) {
        console.log('✅ 通过 - 状态码:', res4.statusCode);
        console.log('   对局 ID:', res4.data.data.id);
        console.log('   黑棋:', res4.data.data.black_player_name);
        console.log('   白棋:', res4.data.data.white_player_name);
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res4.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 5: 获取回放数据
    console.log('测试 5: 获取回放数据');
    try {
      const res5 = await request('/api/games/1/replay');
      if (res5.statusCode === 200 && res5.data.success) {
        console.log('✅ 通过 - 状态码:', res5.statusCode);
        console.log('   落子数量:', res5.data.data.moves.length);
        console.log('   总手数:', res5.data.data.totalMoves);
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res5.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 6: 获取排行榜
    console.log('测试 6: 获取排行榜');
    try {
      const res6 = await request('/api/leaderboard?limit=10');
      if (res6.statusCode === 200 && res6.data.success) {
        console.log('✅ 通过 - 状态码:', res6.statusCode);
        console.log('   排行榜人数:', res6.data.data.leaderboard.length);
        if (res6.data.data.leaderboard.length > 0) {
          console.log('   第一名:', res6.data.data.leaderboard[0].name);
          console.log('   胜率:', res6.data.data.leaderboard[0].win_rate.toFixed(2) + '%');
        }
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res6.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 7: 获取最近对局
    console.log('测试 7: 获取最近对局');
    try {
      const res7 = await request('/api/games/recent?limit=5');
      if (res7.statusCode === 200 && res7.data.success) {
        console.log('✅ 通过 - 状态码:', res7.statusCode);
        console.log('   对局数量:', res7.data.data.length);
        passedTests++;
      } else {
        console.log('❌ 失败 - 响应:', res7.data);
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 8: 参数验证 - 无效的 limit
    console.log('测试 8: 参数验证 (无效的 limit)');
    try {
      const res8 = await request('/api/leaderboard?limit=200');
      if (res8.statusCode === 400 && !res8.data.success) {
        console.log('✅ 通过 - 正确返回 400');
        console.log('   错误信息:', res8.data.error.message);
        passedTests++;
      } else {
        console.log('❌ 失败 - 应该返回 400');
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    // 测试 9: 参数验证 - 无效的对局 ID
    console.log('测试 9: 参数验证 (无效的对局 ID)');
    try {
      const res9 = await request('/api/games/abc');
      if (res9.statusCode === 400 && !res9.data.success) {
        console.log('✅ 通过 - 正确返回 400');
        console.log('   错误信息:', res9.data.error.message);
        passedTests++;
      } else {
        console.log('❌ 失败 - 应该返回 400');
        failedTests++;
      }
    } catch (error) {
      console.log('❌ 失败 - 错误:', error.message);
      failedTests++;
    }
    console.log('');

    console.log('========================================');
    console.log('测试完成');
    console.log('========================================');
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`总计: ${passedTests + failedTests}`);
    console.log(`成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 测试运行失败:', error);
  }
}

// 运行测试
console.log('⚠️  请确保服务器正在运行 (npm start)\n');
setTimeout(runTests, 1000);
