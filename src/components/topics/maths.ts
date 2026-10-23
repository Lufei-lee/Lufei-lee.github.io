import type { ArticleKey } from './articles';
// Separate lines deliberately keep wide expressions readable on small screens.
export const maths: Record<ArticleKey, string[]> = {
 cosmology:[String.raw`1+z=\frac{1}{a},\qquad H=\frac{\dot a}{a}`,String.raw`H^2(a)=H_0^2\!\left[\Omega_r a^{-4}+\Omega_m a^{-3}+\Omega_\Lambda\right]`,String.raw`\begin{gathered}\delta=\frac{\rho-\bar\rho}{\bar\rho}\\[4pt]\ddot\delta+2H\dot\delta-4\pi G\bar\rho_m\delta=0\end{gathered}`],
 'dark-sector':[String.raw`v^2(r)=\frac{G M(<r)}{r}`,String.raw`\begin{gathered}w=\frac{p}{\varepsilon}\\[4pt]\frac{\ddot a}{a}=-\frac{4\pi G}{3c^2}(\varepsilon+3p)\end{gathered}`,String.raw`\varepsilon(a)\propto a^{-3(1+w)}`],
 'machine-learning':[String.raw`\mathbf h=\varphi(W\mathbf x+\mathbf b)`,String.raw`\begin{aligned}\mathcal L(\theta)&=\frac{1}{N}\sum_{i=1}^{N}\bigl[f_\theta(\mathbf x_i)-y_i\bigr]^2\\&\quad+\lambda\lVert\theta\rVert_2^2\end{aligned}`,String.raw`\theta_{t+1}=\theta_t-\eta\nabla_\theta\mathcal L(\theta_t)`],
 finance:[String.raw`R_t=\frac{P_t-P_{t-1}+D_t}{P_{t-1}}`,String.raw`\begin{gathered}\mathbb E[R_p]=\mathbf w^\top\boldsymbol\mu\\\sigma_p^2=\mathbf w^\top\Sigma\mathbf w,\qquad \sum_i w_i=1\end{gathered}`,String.raw`\mathrm{PV}=\sum_{t=1}^{T}\frac{\mathbb E[\mathrm{CF}_t]}{(1+r)^t}`],
};
