/**
 * AdMob Web SDK 广告管理器
 * 用于管理激励广告的加载和展示
 */

// AdMob Web SDK 类型定义
declare global {
  interface Window {
    adsbygoogle?: any[];
    googletag?: any;
  }
}

export interface AdReward {
  type: string;
  amount: number;
}

export class AdManager {
  private rewardedAd: any = null;
  private adUnitId: string;
  private isInitialized: boolean = false;
  private isLoading: boolean = false;

  constructor(adUnitId: string) {
    this.adUnitId = adUnitId;
  }

  /**
   * 初始化 AdMob SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // 加载 AdMob Web SDK
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3940256099942544';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        // 初始化 Google Mobile Ads SDK (Web版)
        if (window.googletag) {
          window.googletag.cmd = window.googletag.cmd || [];
          window.googletag.cmd.push(() => {
            this.isInitialized = true;
            resolve();
          });
        } else {
          // 如果 googletag 不存在，使用 adsbygoogle
          window.adsbygoogle = window.adsbygoogle || [];
          this.isInitialized = true;
          resolve();
        }
      };

      script.onerror = () => {
        console.warn('AdMob SDK 加载失败，将使用模拟广告模式');
        this.isInitialized = true;
        resolve(); // 即使失败也继续，使用模拟模式
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 加载激励广告
   */
  async loadRewardedAd(): Promise<boolean> {
    if (this.isLoading) return false;
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.isLoading = true;

    try {
      // 使用 Google Ad Manager 或 AdSense 的激励广告
      // 注意：网页版 AdMob 需要使用 Google Ad Manager 或 AdSense
      // 这里提供一个通用的实现，实际使用时需要替换为真实的广告单元 ID
      
      // 模拟广告加载（用于测试）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.rewardedAd = {
        adUnitId: this.adUnitId,
        loaded: true,
        show: () => this.showRewardedAd()
      };

      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('加载激励广告失败:', error);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * 展示激励广告
   */
  async showRewardedAd(): Promise<AdReward | null> {
    if (!this.rewardedAd || !this.rewardedAd.loaded) {
      console.warn('广告未加载，尝试重新加载...');
      const loaded = await this.loadRewardedAd();
      if (!loaded) {
        return null;
      }
    }

    return new Promise((resolve) => {
      // 创建广告容器
      const adContainer = document.createElement('div');
      adContainer.id = 'rewarded-ad-container';
      adContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      `;

      // 创建广告内容（实际使用时这里应该是真实的广告）
      const adContent = document.createElement('div');
      adContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        max-width: 90%;
        max-height: 90%;
        text-align: center;
      `;

      // 测试模式：显示模拟广告
      if (this.adUnitId.includes('3940256099942544')) {
        adContent.innerHTML = `
          <h2 style="margin-bottom: 20px;">📺 测试广告</h2>
          <p style="margin-bottom: 20px;">这是一个测试广告</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">观看完成后将获得继续游戏的机会</p>
          <div style="width: 100%; height: 300px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-radius: 8px;">
            <p style="color: #999;">广告内容区域</p>
          </div>
          <button id="close-ad-btn" style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
            完成观看
          </button>
        `;

        const closeBtn = adContent.querySelector('#close-ad-btn');
        closeBtn?.addEventListener('click', () => {
          document.body.removeChild(adContainer);
          // 返回奖励
          resolve({
            type: 'continue_game',
            amount: 1
          });
        });
      } else {
        // 实际广告模式：使用 Google Ad Manager
        adContent.innerHTML = `
          <div id="rewarded-ad-slot" style="min-width: 320px; min-height: 480px;"></div>
          <button id="close-ad-btn" style="margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
            关闭
          </button>
        `;

        // 这里应该加载真实的广告
        // 由于 AdMob Web SDK 的限制，建议使用 Google Ad Manager 或 AdSense
        setTimeout(() => {
          document.body.removeChild(adContainer);
          resolve({
            type: 'continue_game',
            amount: 1
          });
        }, 5000); // 模拟5秒广告
      }

      adContainer.appendChild(adContent);
      document.body.appendChild(adContainer);

      // 监听广告关闭事件
      const handleClose = () => {
        document.body.removeChild(adContainer);
        resolve({
          type: 'continue_game',
          amount: 1
        });
      };

      // ESC 键关闭（仅测试模式）
      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.adUnitId.includes('3940256099942544')) {
          handleClose();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  /**
   * 检查广告是否已加载
   */
  isAdLoaded(): boolean {
    return this.rewardedAd !== null && this.rewardedAd.loaded === true;
  }

  /**
   * 预加载广告
   */
  async preloadAd(): Promise<void> {
    if (!this.isAdLoaded()) {
      await this.loadRewardedAd();
    }
  }
}

// 默认使用测试广告单元 ID
// 实际部署时，请替换为你的真实 AdMob 广告单元 ID
export const adManager = new AdManager(
  process.env.VITE_ADMOB_REWARDED_AD_UNIT_ID || 
  'ca-app-pub-3940256099942544/1712485313' // 测试广告单元 ID
);

